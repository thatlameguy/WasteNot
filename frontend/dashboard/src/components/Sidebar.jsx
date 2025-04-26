"use client"

import { useState } from "react"
import { Home, Package, Bell, Settings, ChevronLeft, ChevronRight, BookOpen, Trash2, LogOut } from "lucide-react"
import UserProfile from "./UserProfile"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  
  const menuItems = [
    { id: "Dashboard", icon: <Home size={20} />, label: "Dashboard" },
    { id: "FoodInventory", icon: <Package size={20} />, label: "Food Inventory" },
    { id: "SavedRecipes", icon: <BookOpen size={20} />, label: "Saved Recipes" },
    { id: "RemovedItems", icon: <Trash2 size={20} />, label: "Removed Items" },
    { id: "Alerts", icon: <Bell size={20} />, label: "Alerts" },
    { id: "Settings", icon: <Settings size={20} />, label: "Settings" },
  ]

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    
    // Apply a style to the main content directly
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (newCollapsedState) {
        mainContent.style.marginLeft = '80px';
        mainContent.style.maxWidth = 'calc(100% - 80px)';
        mainContent.style.width = 'calc(100% - 80px)';
      } else {
        mainContent.style.marginLeft = '280px';
        mainContent.style.maxWidth = 'calc(100% - 280px)';
        mainContent.style.width = 'calc(100% - 280px)';
      }
    }
  }

  const handleLogoutClick = () => {
    console.log("Logout button clicked");
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="logo">
        {!collapsed && "WasteNot"}
      </div>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
            title={collapsed ? item.label : ""}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <UserProfile 
          collapsed={collapsed} 
          user={user}
          setActiveTab={setActiveTab}
        />
        <button 
          className="logout-button" 
          onClick={handleLogoutClick}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
