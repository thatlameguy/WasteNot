// backend/controllers/alertController.js
const Alert = require('../models/alertModel');
const FoodItem = require('../models/foodItemModel');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');

// @desc    Generate alerts for expiring food items
// @route   GET /api/alerts/generate
// @access  Private (Admin only or scheduled job)
const generateAlerts = async (req, res) => {
  try {
    console.log('Generating alerts for expiring food items...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Enhanced query to find items requiring alerts based on our sophisticated freshness criteria
    const items = await FoodItem.find({
      status: 'active', // Only include active items
      $or: [
        // Items expiring within 3 days
        { 
          expiryDate: { 
            $lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) // today + 3 days
          }
        },
        // Items with low freshness that need alerts
        { freshness: { $lt: 40 } },
        // Near expiry items
        { condition: "Near expiry" },
        // All items expiring today 
        {
          expiryDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // today + 1 day
          }
        }
      ]
    }).populate('userId', 'name email');
    
    console.log(`Found ${items.length} items that may need alerts based on expiration or freshness conditions`);
    
    // Find items specifically expiring tomorrow for special handling
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // Separate items expiring tomorrow for special handling
    const itemsExpiringTomorrow = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate >= tomorrow && expiryDate < dayAfterTomorrow;
    });
    
    // Identify items with critical conditions
    const criticalItems = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return (
        // Critical combination: Near expiry and expiring today
        (daysUntilExpiry === 0 && item.condition === "Near expiry") ||
        // Already expired items
        (daysUntilExpiry < 0) ||
        // Very low freshness
        (item.freshness < 30) ||
        // Dairy or meat with low freshness 
        ((isDairyProduct(item.name) || isMeatProduct(item.name)) && item.freshness < 40)
      );
    });
    
    console.log(`Found ${itemsExpiringTomorrow.length} items expiring tomorrow`);
    console.log(`Found ${criticalItems.length} items in critical condition requiring immediate attention`);
    
    let alertsCreated = 0;
    let emailsSent = 0;
    
    // Process all items and create/update alerts
    for (const item of items) {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      
      // FIXED: Calculate days remaining more accurately by comparing dates without using Math.ceil
      // which can cause items expiring today to be labeled as "tomorrow"
      let daysRemaining;
      
      if (expiryDate.getTime() === today.getTime()) {
        // Item expires today
        daysRemaining = 0;
      } else if (expiryDate.getTime() === tomorrow.getTime()) {
        // Item expires tomorrow
        daysRemaining = 1;
      } else {
        // Calculate exact number of days for other cases
        const timeDiff = expiryDate.getTime() - today.getTime();
        daysRemaining = Math.round(timeDiff / (1000 * 60 * 60 * 24));
      }
      
      // Determine alert type
      const alertType = daysRemaining <= 0 ? 'expired' : 'expiring_soon';
      
      // Check if this item is expiring TOMORROW specifically
      const isExpiringTomorrow = daysRemaining === 1;
      
      // Check if this is a critical item (needs special attention)
      const isCritical = criticalItems.some(criticalItem => 
        criticalItem._id.toString() === item._id.toString()
      );
      
      // For critical items and those expiring tomorrow, ensure a fresh alert
      if (isCritical || isExpiringTomorrow) {
        // Delete any existing alerts for this item to ensure a fresh alert is created
        await Alert.deleteMany({
          foodItemId: item._id,
          type: alertType
        });
      }
      
      // Check if alert already exists for this item
      const existingAlert = await Alert.findOne({
        foodItemId: item._id,
        type: alertType,
        isRead: false
      });
      
      // Logic for determining if we need to create or update an alert
      const needsAlert = 
        // No existing alert
        !existingAlert || 
        // Critical items always get fresh alerts
        isCritical || 
        // Items expiring tomorrow get refreshed alerts
        isExpiringTomorrow || 
        // Low freshness items
        item.freshness < 40 ||
        // Near expiry items with less than 3 days
        (item.condition === "Near expiry" && daysRemaining <= 3);
      
      // Create or update alert if needed
      if (needsAlert) {
        let alertToUpdate;
        
        if (!existingAlert) {
          // Get food category if available from freshnessReason (format might be "Category: Dairy")
          let foodCategory = "";
          if (item.freshnessReason && item.freshnessReason.includes("Category:")) {
            const match = item.freshnessReason.match(/Category:\s*(\w+)/i);
            if (match && match[1]) {
              foodCategory = match[1];
            }
          }
          
          // Create new alert with detailed information
          alertToUpdate = await Alert.create({
            userId: item.userId._id,
            foodItemId: item._id,
            itemName: item.name,
            expiryDate: item.expiryDate,
            type: alertType,
            daysRemaining: daysRemaining,
            isRead: false,
            isEmailSent: false,
            isCritical: isCritical,
            freshness: item.freshness,
            foodCategory: foodCategory || getCategoryFromName(item.name)
          });
          
          alertsCreated++;
          console.log(`Created new alert for ${item.name} (expires in ${daysRemaining} days, freshness: ${item.freshness}%)`);
        } else {
          // Use existing alert but update its properties
          alertToUpdate = existingAlert;
          
          // Update alert properties
          alertToUpdate.daysRemaining = daysRemaining;
          alertToUpdate.isEmailSent = false;
          alertToUpdate.isCritical = isCritical;
          alertToUpdate.freshness = item.freshness;
          
          await alertToUpdate.save();
          console.log(`Updated existing alert for ${item.name}`);
        }
      }
    }
    
    // --- NEW CODE: Group items by user and expiry date for consolidated emails ---
    // Collect all alerts that need emails, grouped by user and expiration dates
    const userAlerts = {};
    
    // Get all alerts that need emails
    const alertsNeedingEmails = await Alert.find({
      isEmailSent: false,
      // Only include alerts for active items
      foodItemId: { $in: items.map(item => item._id) }
    }).populate({
      path: 'userId',
      select: 'name email'
    }).populate({
      path: 'foodItemId',
      select: 'name expiryDate storage condition'
    });
    
    // Group alerts by user and expiry date
    for (const alert of alertsNeedingEmails) {
      if (!alert.userId || !alert.userId.email) continue;
      
      const userId = alert.userId._id.toString();
      const expiryDate = new Date(alert.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const expiryKey = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Initialize user entry if it doesn't exist
      if (!userAlerts[userId]) {
        userAlerts[userId] = {
          user: alert.userId,
          expiryGroups: {}
        };
      }
      
      // Initialize expiry date group if it doesn't exist
      if (!userAlerts[userId].expiryGroups[expiryKey]) {
        // FIXED: Calculate days remaining more accurately for the group
        const expiryDateObj = new Date(expiryDate);
        let daysRemaining;
        
        if (expiryDateObj.getTime() === today.getTime()) {
          // Item expires today
          daysRemaining = 0;
        } else if (expiryDateObj.getTime() === tomorrow.getTime()) {
          // Item expires tomorrow
          daysRemaining = 1;
        } else {
          // Calculate exact number of days for other cases
          const timeDiff = expiryDateObj.getTime() - today.getTime();
          daysRemaining = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        }
        
        userAlerts[userId].expiryGroups[expiryKey] = {
          date: expiryDateObj,
          daysRemaining: daysRemaining,
          items: [],
          alertType: daysRemaining <= 0 ? 'expired' : 'expiring_soon',
          hasCriticalItems: false
        };
      }
      
      // Add item to the appropriate expiry group
      userAlerts[userId].expiryGroups[expiryKey].items.push({
        alert: alert,
        item: alert.foodItemId,
        isCritical: alert.isCritical
      });
      
      // Check if this group has any critical items
      if (alert.isCritical) {
        userAlerts[userId].expiryGroups[expiryKey].hasCriticalItems = true;
      }
    }
    
    // Send consolidated emails for each user and expiry date group
    for (const userId in userAlerts) {
      const userData = userAlerts[userId];
      
      for (const expiryKey in userData.expiryGroups) {
        const expiryGroup = userData.expiryGroups[expiryKey];
        
        // Skip expiry groups with no items (shouldn't happen, but just in case)
        if (expiryGroup.items.length === 0) continue;
        
        // Send consolidated email for this expiry group
        await sendConsolidatedAlertEmail(
          userData.user,
          expiryGroup.items,
          expiryGroup.date,
          expiryGroup.daysRemaining,
          expiryGroup.alertType,
          expiryGroup.hasCriticalItems
        );
        
        // Mark all alerts in this group as email sent
        for (const itemData of expiryGroup.items) {
          itemData.alert.isEmailSent = true;
          await itemData.alert.save();
        }
        
        // Increment email counter (only count once per consolidated email)
        emailsSent++;
      }
    }
    
    // Prepare result object with statistics
    const result = {
      alertsCreated,
      emailsSent,
      criticalItemsCount: criticalItems.length,
      itemsExpiringTomorrowCount: itemsExpiringTomorrow.length,
      totalItemsProcessed: items.length
    };
    
    // If called from API route, send response
    if (res) {
      return res.status(200).json({
        success: true,
        message: 'Alerts generated successfully',
        ...result
      });
    }
    
    // If called programmatically (e.g. from cron job), return result
    return result;
  } catch (error) {
    console.error('Error generating alerts:', error);
    
    // If called from API route, send error response
    if (res) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate alerts',
        message: error.message
      });
    }
    
    // If called programmatically, throw the error or return error object
    throw error;
  }
};

// --- NEW FUNCTION: Send consolidated email for multiple items with same expiry date ---
const sendConsolidatedAlertEmail = async (user, itemsData, expiryDate, daysRemaining, alertType, hasCriticalItems) => {
  try {
    // Create a nodemailer transporter
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Add DKIM and SPF verification hints for email providers
      dkim: process.env.DKIM_PRIVATE_KEY ? {
        domainName: process.env.DKIM_DOMAIN,
        keySelector: process.env.DKIM_SELECTOR,
        privateKey: process.env.DKIM_PRIVATE_KEY
      } : undefined,
      // Add helpful headers to improve deliverability
      headers: {
        'X-Priority': hasCriticalItems ? '1 (Highest)' : '3 (Normal)',
        'X-MSMail-Priority': hasCriticalItems ? 'High' : 'Normal',
        'Importance': hasCriticalItems ? 'High' : 'Normal'
      }
    });
    
    // Format expiry date for email
    const expiryDateFormatted = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Get count of items
    const itemCount = itemsData.length;
    
    // Prepare variables for email content
    let subject, headerText, introText, headerBgColor;
    const appName = process.env.APP_NAME || 'WasteNot';
    
    // Determine email type and content based on alert type
    if (alertType === 'expired') {
      // Email for expired items
      headerBgColor = '#e74c3c'; // Red for expired
      headerText = `${itemCount} Food Item${itemCount > 1 ? 's have' : ' has'} Expired`;
      subject = `${appName} Alert: ${itemCount} food item${itemCount > 1 ? 's have' : ' has'} expired!`;
      introText = `<p>Hello ${user.name},</p>
                  <p>You have <strong>${itemCount} food item${itemCount > 1 ? 's' : ''}</strong> that ${itemCount > 1 ? 'have' : 'has'} expired on <strong>${expiryDateFormatted}</strong>.</p>
                  <p>We recommend using or disposing of ${itemCount > 1 ? 'these items' : 'this item'} properly to maintain food safety.</p>`;
    } else {
      // FIXED: Ensure items expiring today are correctly labeled as "today"
      // The daysRemaining value should already be corrected in the main function
      const daysText = daysRemaining === 0 ? 'today' : 
                      daysRemaining === 1 ? 'tomorrow' :
                      `in ${daysRemaining} days`;
      
      headerBgColor = daysRemaining <= 1 ? '#ff9800' : '#2196F3'; // Orange for urgent, blue for less urgent
      headerText = `${itemCount} Food Item${itemCount > 1 ? 's' : ''} Expiring ${daysText.charAt(0).toUpperCase() + daysText.slice(1)}`;
      subject = `${appName} Alert: ${itemCount} food item${itemCount > 1 ? 's' : ''} expiring ${daysText}!`;
      introText = `<p>Hello ${user.name},</p>
                  <p>You have <strong>${itemCount} food item${itemCount > 1 ? 's' : ''}</strong> that will expire ${daysText} (<strong>${expiryDateFormatted}</strong>).</p>
                  <p>To reduce food waste, consider using ${itemCount > 1 ? 'these items' : 'this item'} soon or finding recipes that use ${itemCount > 1 ? 'them' : 'it'}.</p>`;
    }
    
    // Build the items list for the email
    let itemsList = '';
    // Group items by category for better organization
    const categorizedItems = {};
    
    itemsData.forEach(itemData => {
      const item = itemData.item;
      // Get category - default to "Other" if not available
      const category = item.foodCategory || itemData.alert.foodCategory || 'Other';
      
      if (!categorizedItems[category]) {
        categorizedItems[category] = [];
      }
      
      categorizedItems[category].push({
        name: item.name,
        isCritical: itemData.isCritical,
        freshness: itemData.alert.freshness,
        storage: item.storage,
        condition: item.condition
      });
    });
    
    // Build items list by category
    for (const category in categorizedItems) {
      // Skip empty categories (shouldn't happen)
      if (categorizedItems[category].length === 0) continue;
      
      // Add category header
      itemsList += `
        <div style="margin-top: 15px;">
          <h3 style="margin-bottom: 10px; color: #333; border-bottom: 1px solid #eaeaea; padding-bottom: 5px;">
            ${category.charAt(0).toUpperCase() + category.slice(1)}
          </h3>
          <ul style="list-style-type: none; padding-left: 0;">
      `;
      
      // Add items in this category
      categorizedItems[category].forEach(item => {
        const criticalStyle = item.isCritical ? 'color: #e74c3c; font-weight: bold;' : '';
        const freshnessText = item.freshness ? `Freshness: ${item.freshness}%` : '';
        const storageText = item.storage ? `Storage: ${item.storage}` : '';
        const conditionText = item.condition ? `Condition: ${item.condition}` : '';
        
        const detailsArray = [freshnessText, storageText, conditionText].filter(text => text !== '');
        const details = detailsArray.length > 0 ? ` (${detailsArray.join(', ')})` : '';
        
        itemsList += `<li style="margin: 8px 0; padding: 8px; background-color: ${item.isCritical ? '#fff3f3' : '#f8f8f8'}; border-radius: 4px;">
                      <span style="${criticalStyle}">${item.name}</span>${details}
                    </li>`;
      });
      
      itemsList += `
          </ul>
        </div>
      `;
    }
    
    // Build email message with list of items
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${headerBgColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${headerText}</h1>
        </div>
        <div style="padding: 20px;">
          ${introText}
          
          <div style="background-color: #f8f8f8; border-left: 4px solid ${headerBgColor}; padding: 15px; margin: 20px 0;">
            <strong>Food Items (${itemCount}):</strong>
            ${itemsList}
          </div>
          
          <p style="margin-top: 30px;">Thank you for using ${appName} to reduce food waste!</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; color: #666; border-top: 1px solid #eaeaea;">
          <p>You received this email because you have alerts enabled in your ${appName} account.</p>
          <p>To manage your notifications, log in to your account and go to the Settings page.</p>
          <p>This is not a marketing email. It is an important notification about items in your inventory.</p>
        </div>
      </div>
    `;
    
    // Send email
    await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || `${appName} App`,
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: subject,
      html: message,
      // Add additional headers to reduce spam likelihood
      priority: hasCriticalItems ? 'high' : 'normal',
      headers: {
        'List-Unsubscribe': `<${process.env.APP_URL || 'http://localhost:5173'}/settings>`,
        'Precedence': 'bulk'
      }
    });
    
    console.log(`Consolidated alert email sent to ${user.email} for ${itemCount} items expiring on ${expiryDateFormatted}`);
    
    return true;
  } catch (error) {
    console.error('Error sending consolidated alert email:', error);
    return false;
  }
};

// Keep the original sendAlertEmail function for any individual alerts that might still need it
const sendAlertEmail = async (user, item, daysRemaining, alertType, isCritical) => {
  try {
    // Create a nodemailer transporter
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Add DKIM and SPF verification hints for email providers
      dkim: process.env.DKIM_PRIVATE_KEY ? {
        domainName: process.env.DKIM_DOMAIN,
        keySelector: process.env.DKIM_SELECTOR,
        privateKey: process.env.DKIM_PRIVATE_KEY
      } : undefined,
      // Add helpful headers to improve deliverability
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });
    
    // Format expiry date for email
    const expiryDateFormatted = new Date(item.expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let subject, message;
    const appName = process.env.APP_NAME || 'WasteNot';
    
    if (alertType === 'expired') {
      // Email for expired items
      subject = `${appName} Alert: Your ${item.name} has expired!`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Food Item Expired</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${user.name},</p>
            <p>Your <strong>${item.name}</strong> has expired on <strong>${expiryDateFormatted}</strong>.</p>
            <p>We recommend using or disposing of this item properly to maintain food safety.</p>
            
            <div style="background-color: #f8f8f8; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
              <strong>Food Item Details:</strong><br>
              Name: ${item.name}<br>
              Expiry Date: ${expiryDateFormatted}<br>
              ${item.storage ? `Storage: ${item.storage}<br>` : ''}
              ${item.condition ? `Condition: ${item.condition}<br>` : ''}
            </div>
            
            <p style="margin-top: 30px;">Thank you for using ${appName} to reduce food waste!</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; color: #666; border-top: 1px solid #eaeaea;">
            <p>You received this email because you have alerts enabled in your ${appName} account.</p>
            <p>To manage your notifications, log in to your account and go to the Settings page.</p>
            <p>This is not a marketing email. It is an important notification about items in your inventory.</p>
          </div>
        </div>
      `;
    } else {
      // FIXED: Ensure items expiring today are correctly labeled as "today"
      // Email for items expiring soon - the daysRemaining value should be correctly calculated in the main function
      const daysText = daysRemaining === 0 ? 'today' : 
                      daysRemaining === 1 ? 'tomorrow' :
                      `in ${daysRemaining} days`;
      
      subject = `${appName} Alert: Your ${item.name} expires ${daysText}!`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Food Item Expiring Soon</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${user.name},</p>
            <p>Your <strong>${item.name}</strong> will expire ${daysText} (<strong>${expiryDateFormatted}</strong>).</p>
            <p>To reduce food waste, consider using this item soon or finding a recipe that uses it.</p>
            
            <div style="background-color: #f8f8f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
              <strong>Food Item Details:</strong><br>
              Name: ${item.name}<br>
              Expiry Date: ${expiryDateFormatted}<br>
              Expiring: ${daysText}<br>
              ${item.storage ? `Storage: ${item.storage}<br>` : ''}
              ${item.condition ? `Condition: ${item.condition}<br>` : ''}
            </div>
            
            <p style="margin-top: 30px;">Thank you for using ${appName} to reduce food waste!</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; color: #666; border-top: 1px solid #eaeaea;">
            <p>You received this email because you have alerts enabled in your ${appName} account.</p>
            <p>To manage your notifications, log in to your account and go to the Settings page.</p>
            <p>This is not a marketing email. It is an important notification about items in your inventory.</p>
          </div>
        </div>
      `;
    }
    
    // Send email
    await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || `${appName} App`,
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: subject,
      html: message,
      // Add additional headers to reduce spam likelihood
      priority: 'high',
      headers: {
        'List-Unsubscribe': `<${process.env.APP_URL || 'http://localhost:5173'}/settings>`,
        'Precedence': 'bulk'
      }
    });
    
    console.log(`Alert email sent to ${user.email} for ${item.name} (${alertType === 'expired' ? 'expired on' : 'expires on'}: ${expiryDateFormatted})`);
    
    return true;
  } catch (error) {
    console.error('Error sending alert email:', error);
    return false;
  }
};

// @desc    Get all alerts for a user
// @route   GET /api/alerts
// @access  Private
const getUserAlerts = async (req, res) => {
  try {
    // First run generateAlerts to make sure we have the latest alerts, especially for items expiring tomorrow
    console.log('Checking for new alerts before retrieving user alerts...');
    
    try {
      // Always generate fresh alerts, especially for tomorrow's expirations
      const result = await generateAlerts(null, null);
      if (result.alertsCreated > 0) {
        console.log(`Created ${result.alertsCreated} new alerts during user fetch`);
      }
      if (result.itemsExpiringTomorrowCount > 0) {
        console.log(`Found ${result.itemsExpiringTomorrowCount} items expiring tomorrow`);
      }
      if (result.emailsSent > 0) {
        console.log(`Sent ${result.emailsSent} emails during alert check`);
      }
    } catch (error) {
      console.error('Error checking for new alerts:', error);
      // Continue execution even if alert generation fails
    }
    
    // Now retrieve alerts for the user
    const alerts = await Alert.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'foodItemId',
        select: 'name expiryDate storage condition freshness',
        options: { retainNullValues: true }
      });
    
    res.json(alerts);
  } catch (error) {
    console.error('Error getting user alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
// @access  Private
const markAlertAsRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    alert.isRead = true;
    await alert.save();
    
    res.json(alert);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Clear all alerts for a user
// @route   DELETE /api/alerts
// @access  Private
const clearAllAlerts = async (req, res) => {
  try {
    await Alert.deleteMany({ userId: req.user._id });
    
    res.json({ message: 'All alerts cleared' });
  } catch (error) {
    console.error('Error clearing alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions
function isDairyProduct(name) {
  const dairyKeywords = ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'dairy'];
  name = name.toLowerCase();
  return dairyKeywords.some(keyword => name.includes(keyword));
}

function isMeatProduct(name) {
  const meatKeywords = ['meat', 'beef', 'chicken', 'pork', 'lamb', 'fish', 'seafood', 'turkey', 'steak'];
  name = name.toLowerCase();
  return meatKeywords.some(keyword => name.includes(keyword));
}

function getCategoryFromName(name) {
  name = name.toLowerCase();
  
  if (isDairyProduct(name)) return 'dairy';
  if (isMeatProduct(name)) return 'meat';
  
  const produceKeywords = ['fruit', 'vegetable', 'apple', 'banana', 'tomato', 'lettuce', 'produce'];
  if (produceKeywords.some(keyword => name.includes(keyword))) return 'produce';
  
  const bakedKeywords = ['bread', 'cake', 'pastry', 'cookie', 'muffin', 'baked'];
  if (bakedKeywords.some(keyword => name.includes(keyword))) return 'baked';
  
  const pantryKeywords = ['rice', 'pasta', 'flour', 'sugar', 'cereal', 'can', 'canned', 'dry', 'pantry'];
  if (pantryKeywords.some(keyword => name.includes(keyword))) return 'pantry';
  
  return 'other';
}

module.exports = {
  generateAlerts,
  getUserAlerts,
  markAlertAsRead,
  clearAllAlerts
};