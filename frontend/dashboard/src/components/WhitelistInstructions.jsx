import React, { useState } from 'react';
import { X, Mail, Copy, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const WhitelistInstructions = ({ onClose }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const copyEmail = () => {
    const email = "notifications@wastenot.app";
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };
  
  return (
    <div className="whitelist-instructions-overlay">
      <div className="whitelist-instructions-modal">
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="modal-header">
          <Mail size={24} />
          <h2>Whitelist Our Emails</h2>
        </div>
        
        <p className="intro-text">
          To ensure you receive important food expiration alerts in your inbox 
          rather than spam folder, please whitelist our email address:
        </p>
        
        <div className="email-copy-container">
          <span className="email-address">notifications@wastenot.app</span>
          <button className="copy-button" onClick={copyEmail}>
            {copied ? <CheckCircle size={18} color="#22c55e" /> : <Copy size={18} />}
          </button>
        </div>
        
        <div className="instructions-container">
          <div className="instruction-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('gmail')}
            >
              <h3>Gmail Instructions</h3>
              {expandedSection === 'gmail' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {expandedSection === 'gmail' && (
              <ol className="instruction-steps">
                <li>Open any email from WasteNot</li>
                <li>Click the three dots in the top-right corner</li>
                <li>Click "Filter messages like these"</li>
                <li>Click "Create filter"</li>
                <li>Check "Never send to Spam"</li>
                <li>Click "Create filter"</li>
              </ol>
            )}
          </div>
          
          <div className="instruction-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('outlook')}
            >
              <h3>Outlook Instructions</h3>
              {expandedSection === 'outlook' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {expandedSection === 'outlook' && (
              <ol className="instruction-steps">
                <li>Open any email from WasteNot</li>
                <li>Right-click on the sender's email</li>
                <li>Select "Add to Safe Senders"</li>
                <li>Click "OK" to confirm</li>
              </ol>
            )}
          </div>
          
          <div className="instruction-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('yahoo')}
            >
              <h3>Yahoo Mail Instructions</h3>
              {expandedSection === 'yahoo' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {expandedSection === 'yahoo' && (
              <ol className="instruction-steps">
                <li>Open any email from WasteNot</li>
                <li>Click the three dots (...) at the top</li>
                <li>Select "Filter messages like this"</li>
                <li>Choose "Always deliver to Inbox"</li>
                <li>Click "Save"</li>
              </ol>
            )}
          </div>
          
          <div className="instruction-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('apple')}
            >
              <h3>Apple Mail Instructions</h3>
              {expandedSection === 'apple' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {expandedSection === 'apple' && (
              <ol className="instruction-steps">
                <li>Open any email from WasteNot</li>
                <li>Click on the sender's email address</li>
                <li>Click "Add to VIPs"</li>
              </ol>
            )}
          </div>
        </div>
        
        <div className="why-whitelist">
          <h3>Why is this important?</h3>
          <p>
            Whitelisting ensures you'll never miss important alerts about food items 
            that are about to expire. This helps you reduce food waste and save money.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhitelistInstructions; 