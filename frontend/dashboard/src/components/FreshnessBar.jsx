function FreshnessBar({ freshness, isExpired }) {
  // Handle invalid freshness values
  const validFreshness = typeof freshness === 'number' && !isNaN(freshness) 
    ? Math.max(0, Math.min(100, freshness)) 
    : 0;

  // Force a maximum of 20% freshness for expired items in the display
  const displayFreshness = isExpired ? Math.min(20, validFreshness) : validFreshness;

  // Determine color based on freshness percentage with more granular thresholds
  const getBarColor = (value) => {
    if (isExpired) return "var(--danger-color)"       // Always red for expired items
    if (value >= 75) return "var(--primary-color)"    // Green for very fresh
    if (value >= 50) return "var(--success-color)"    // Light green for good
    if (value >= 30) return "var(--warning-color)"    // Orange for warning
    if (value >= 15) return "var(--caution-color)"    // Dark orange for caution
    return "var(--danger-color)"                      // Red for poor freshness
  }

  // Get appropriate label text based on freshness range
  const getFreshnessLabel = (value) => {
    if (isExpired) return "Expired"                    // Always show as expired for expired items
    if (value >= 90) return "Very Fresh"
    if (value >= 70) return "Fresh"
    if (value >= 50) return "Good"
    if (value >= 30) return "Fair"
    if (value >= 15) return "Poor"
    if (value > 0) return "Questionable"
    return "Expired"
  }

  return (
    <div className="freshness-container">
      <div className="freshness-bar-wrapper">
        <div
          className="freshness-bar"
          style={{
            width: `${displayFreshness}%`,
            backgroundColor: getBarColor(displayFreshness),
            transition: "width 0.5s ease-in-out, background-color 0.5s ease-in-out"
          }}
        ></div>
      </div>
      <div className="freshness-label">
        <span className="freshness-percentage">{Math.round(displayFreshness)}%</span>
        <span className="freshness-text">{getFreshnessLabel(displayFreshness)}</span>
      </div>
    </div>
  )
}

export default FreshnessBar
