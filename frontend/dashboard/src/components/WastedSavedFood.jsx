"use client"

import { useEffect, useRef } from "react"

function WastedSavedFood({ consumedItems = [], wastedItems = [] }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    // Set canvas dimensions with higher resolution for better rendering
    canvas.width = 240
    canvas.height = 240
    
    // Set display size through CSS
    canvas.style.width = "220px"
    canvas.style.height = "220px"

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // Draw pie chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Calculate percentages based on actual data
    const totalItems = consumedItems.length + wastedItems.length
    
    // Default to 50/50 if no data is available
    let savedPercentage = 0.5
    let wastedPercentage = 0.5
    
    // Only calculate if we have data
    if (totalItems > 0) {
      savedPercentage = consumedItems.length / totalItems
      wastedPercentage = wastedItems.length / totalItems
    }

    // Add a white circle in the background
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()

    // Draw wasted portion (red)
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2 * wastedPercentage)
    ctx.fillStyle = "rgba(239, 68, 68, 0.95)" // var(--danger-color)
    ctx.fill()

    // Draw saved portion (green)
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, Math.PI * 2 * wastedPercentage, Math.PI * 2)
    ctx.fillStyle = "rgba(16, 185, 129, 0.95)" // var(--primary-color)
    ctx.fill()

    // Add a white circle in the center for a donut chart effect
    const innerRadius = radius * 0.6
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()

    // Add inner shadows for depth
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"
    ctx.stroke()

    // Function to draw text with background for better visibility
    const drawTextWithBackground = (text, x, y, textColor, bgColor) => {
      // Measure text width
      const textWidth = ctx.measureText(text).width
      
      // Draw background pill
      ctx.beginPath()
      ctx.roundRect(x - textWidth/2 - 8, y - 12, textWidth + 16, 24, 12)
      ctx.fillStyle = bgColor
      ctx.fill()
      
      // Draw text
      ctx.fillStyle = textColor
      ctx.fillText(text, x, y)
    }

    // Draw percentages on the chart
    ctx.font = "bold 16px Inter, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    
    // Draw wasted percentage text
    const wastedAngle = Math.PI * wastedPercentage //Keep the text in the middle
    const wastedLabelRadius = (radius + innerRadius) / 2
    const wastedLabelX = centerX + wastedLabelRadius * Math.cos(wastedAngle)
    const wastedLabelY = centerY + wastedLabelRadius * Math.sin(wastedAngle)
    
    drawTextWithBackground(
      `${Math.round(wastedPercentage * 100)}%`, 
      wastedLabelX, 
      wastedLabelY, 
      "white", 
      "rgba(239, 68, 68, 1)"
    )
    
    // Draw saved percentage text
    const savedAngle = Math.PI * (1 + wastedPercentage) + Math.PI * savedPercentage / 2 // Middle of saved section
    const savedLabelRadius = (radius + innerRadius) / 2
    const savedLabelX = centerX + savedLabelRadius * Math.cos(savedAngle)
    const savedLabelY = centerY + savedLabelRadius * Math.sin(savedAngle)
    
    drawTextWithBackground(
      `${Math.round(savedPercentage * 100)}%`, 
      savedLabelX, 
      savedLabelY, 
      "white", 
      "rgba(16, 185, 129, 1)"
    )
    
    // Add center text with total food tracked
    ctx.font = "bold 14px Inter, sans-serif"
    ctx.fillStyle = "#1e293b" // var(--text-color)
    ctx.fillText("Total Food", centerX, centerY - 10)
    ctx.fillText(`${totalItems} items`, centerX, centerY + 10)
  }, [consumedItems, wastedItems])

  return (
    <div className="card wasted-saved">
      <h2>Wasted vs. Saved Food</h2>
      <p>Track how much food you've saved from being wasted</p>
      <div className="chart-container">
        <canvas ref={canvasRef}></canvas>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color saved"></div>
            <span>Saved Food ({consumedItems.length})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color wasted"></div>
            <span>Wasted Food ({wastedItems.length})</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WastedSavedFood
