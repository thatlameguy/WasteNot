"use client"

import { useState, useRef, useEffect } from "react"

const ResizableCard = ({ children, cardId, size, onSizeChange }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentSize, setCurrentSize] = useState(size)
  const [showTooltip, setShowTooltip] = useState(false)
  const cardRef = useRef(null)
  const tooltipRef = useRef(null)

  // Update the size when the prop changes (e.g. from settings)
  useEffect(() => {
    setCurrentSize(size)
  }, [size])

  // Determine the next size based on the current size and the drag direction
  const getNextSize = (deltaX, deltaY) => {
    const totalDelta = deltaX + deltaY

    // Size progression: small -> medium -> large -> small
    switch (currentSize) {
      case 'small':
        return totalDelta > 50 ? 'medium' : 'small'
      case 'medium':
        return totalDelta > 50 ? 'large' : (totalDelta < -50 ? 'small' : 'medium')
      case 'large':
        return totalDelta < -50 ? 'medium' : 'large'
      default:
        return 'medium'
    }
  }

  const handleResizeStart = (e) => {
    e.preventDefault()
    setIsResizing(true)
    setStartPos({ x: e.clientX, y: e.clientY })

    // Show tooltip temporarily on resize start
    setShowTooltip(true)
    setTimeout(() => setShowTooltip(false), 2000)

    // Add event listeners for dragging
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const handleResize = (e) => {
    if (!isResizing) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y
    
    // Update the tooltip to show current size
    if (tooltipRef.current) {
      tooltipRef.current.textContent = `Size: ${currentSize}`;
    }
    
    // Determine the next size based on the drag
    const nextSize = getNextSize(deltaX, deltaY)
    
    // If the size has changed, update the local state
    if (nextSize !== currentSize) {
      setCurrentSize(nextSize)
      // Update tooltip
      if (tooltipRef.current) {
        tooltipRef.current.textContent = `Size: ${nextSize}`;
      }
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    // Persist the size change
    if (onSizeChange && currentSize !== size) {
      onSizeChange(cardId, currentSize)
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', handleResizeEnd)
  }

  return (
    <div className={`card-container ${currentSize}-card ${isResizing ? 'resizing' : ''}`} ref={cardRef}>
      <div className="resizable-card">
        {children}
        <div 
          className="resize-handle" 
          onMouseDown={handleResizeStart} 
          title="Drag to resize"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => !isResizing && setShowTooltip(false)}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1L1 9M5 1L1 5M9 5L5 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div 
          className="resize-indicator" 
          style={{ opacity: showTooltip || isResizing ? 1 : 0 }}
          ref={tooltipRef}
        >
          {`Size: ${currentSize}`}
        </div>
      </div>
      {isResizing && <div className="resize-overlay"></div>}
    </div>
  )
}

export default ResizableCard 