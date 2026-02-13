import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const EverydayStats = () => {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6); // Last 7 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [quickSelect, setQuickSelect] = useState("7");

  // Fetch everyday stats
  const fetchEverydayStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: startDate,
        end_date: endDate
      };

      const response = await api.get(`/zyrax/analytics/everyday-stats/`, { params });

      // Validate response structure
      if (response.data && typeof response.data === 'object') {
        // Ensure daily_stats is an array
        if (!response.data.daily_stats || !Array.isArray(response.data.daily_stats)) {
          console.warn('daily_stats is missing or not an array:', response.data);
          response.data.daily_stats = [];
        }

        // Ensure summary exists with default values
        if (!response.data.summary || typeof response.data.summary !== 'object') {
          console.warn('summary is missing:', response.data);
          response.data.summary = {
            total_joins: 0,
            total_unique_users: 0,
            total_attendance_records: 0,
            avg_joins_per_day: 0
          };
        }

        // Validate each day's data
        response.data.daily_stats.forEach((day, index) => {
          if (!day.joins || typeof day.joins !== 'object') {
            console.warn(`Day ${index} missing joins data:`, day);
            day.joins = { total_joins: 0, unique_users: 0, women: 0, men: 0, by_class: [] };
          }
          if (!Array.isArray(day.joins.by_class)) {
            day.joins.by_class = [];
          }
          if (!day.attendance || typeof day.attendance !== 'object') {
            console.warn(`Day ${index} missing attendance data:`, day);
            day.attendance = { total_attendance: 0, unique_users: 0, women: 0, men: 0, by_class: [] };
          }
          if (!Array.isArray(day.attendance.by_class)) {
            day.attendance.by_class = [];
          }
        });

        setStatsData(response.data);
      } else {
        console.error('Invalid response data structure:', response.data);
        setError('Received invalid data format from server');
        setStatsData(null);
      }
    } catch (err) {
      console.error('Error fetching everyday stats:', err);
      setError(`Failed to fetch stats: ${err.response?.data?.detail || err.message}`);
      setStatsData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Handle quick date range selection
  const handleQuickSelect = (days) => {
    setQuickSelect(days);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (parseInt(days) - 1));

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  // Load stats on component mount and when dates change
  useEffect(() => {
    fetchEverydayStats();
  }, [fetchEverydayStats]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>📊 Everyday Attendance & Analytics</h2>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Debug Info Panel */}
      {statsData && (
        <details style={{
          backgroundColor: '#f0f8ff',
          border: '2px solid #4a90e2',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}>
          <summary style={{fontWeight: 'bold', color: '#4a90e2', cursor: 'pointer'}}>
            🔍 Debug Info (Click to expand)
          </summary>
          <div style={{marginTop: '15px', fontSize: '13px', fontFamily: 'monospace'}}>
            <p><strong>Date Range:</strong> {startDate} to {endDate}</p>
            <p><strong>Total Joins in Period:</strong> {statsData?.summary?.total_joins || 0}</p>
            <p><strong>Total Attendance Records:</strong> {statsData?.summary?.total_attendance_records || 0}</p>
            <p><strong>Unique Users:</strong> {statsData?.summary?.total_unique_users || 0}</p>
            <p><strong>Days with Data:</strong> {statsData?.daily_stats?.length || 0}</p>
            <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', maxHeight: '300px', overflow: 'auto'}}>
              <strong>Daily Breakdown:</strong>
              {statsData?.daily_stats?.map((day, idx) => (
                <div key={idx} style={{marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
                  <div><strong>Date:</strong> {day.date}</div>
                  <div><strong>Joins:</strong> {day.joins?.total_joins || 0} (by_class entries: {day.joins?.by_class?.length || 0})</div>
                  <div><strong>Attendance:</strong> {day.attendance?.total_attendance || 0} (by_class entries: {day.attendance?.by_class?.length || 0})</div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* Date Range Selector */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3>📅 Date Range</h3>
        </div>

        <div style={styles.dateControls}>
          <div style={styles.quickSelectButtons}>
            <button
              onClick={() => handleQuickSelect("7")}
              style={{...styles.quickButton, ...(quickSelect === "7" ? styles.quickButtonActive : {})}}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleQuickSelect("14")}
              style={{...styles.quickButton, ...(quickSelect === "14" ? styles.quickButtonActive : {})}}
            >
              Last 14 Days
            </button>
            <button
              onClick={() => handleQuickSelect("30")}
              style={{...styles.quickButton, ...(quickSelect === "30" ? styles.quickButtonActive : {})}}
            >
              Last 30 Days
            </button>
          </div>

          <div style={styles.dateInputs}>
            <div style={styles.dateInputGroup}>
              <label style={styles.label}>From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setQuickSelect("");
                }}
                style={styles.dateInput}
              />
            </div>
            <div style={styles.dateInputGroup}>
              <label style={styles.label}>To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setQuickSelect("");
                }}
                style={styles.dateInput}
              />
            </div>
            <button onClick={fetchEverydayStats} style={styles.refreshButton}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div style={styles.loadingContainer}>
          <p>Loading statistics...</p>
        </div>
      ) : statsData ? (
        <>
          {/* Summary Statistics */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>📈 Summary Statistics</h3>
            <div style={styles.statsGrid}>
              <div style={{...styles.statCard, backgroundColor: '#e3f2fd'}}>
                <div style={styles.statValue}>{statsData.summary.total_joins}</div>
                <div style={styles.statLabel}>Total Joins</div>
              </div>
              <div style={{...styles.statCard, backgroundColor: '#f3e5f5'}}>
                <div style={styles.statValue}>{statsData.summary.total_unique_users}</div>
                <div style={styles.statLabel}>Unique Users</div>
              </div>
              <div style={{...styles.statCard, backgroundColor: '#e8f5e9'}}>
                <div style={styles.statValue}>{statsData.summary.total_attendance_records}</div>
                <div style={styles.statLabel}>Attendance Records</div>
              </div>
              <div style={{...styles.statCard, backgroundColor: '#fff3e0'}}>
                <div style={styles.statValue}>{statsData.summary.avg_joins_per_day}</div>
                <div style={styles.statLabel}>Avg Joins/Day</div>
              </div>
            </div>
          </section>

          {/* Daily Breakdown */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>📅 Daily Breakdown</h3>
            {statsData.daily_stats && statsData.daily_stats.length > 0 ? (
              <div style={styles.dailyContainer}>
                {statsData.daily_stats.map((day, index) => (
                <div key={index} style={styles.dayCard}>
                  <div style={styles.dayHeader}>
                    <h4 style={styles.dayTitle}>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h4>
                  </div>

                  {/* Joins Stats */}
                  <div style={styles.statsSection}>
                    <h5 style={styles.statsSubtitle}>👥 Class Joins</h5>
                    <div style={styles.miniStatsGrid}>
                      <div style={styles.miniStat}>
                        <div style={styles.miniStatValue}>{day.joins.total_joins}</div>
                        <div style={styles.miniStatLabel}>Total</div>
                      </div>
                      <div style={styles.miniStat}>
                        <div style={styles.miniStatValue}>{day.joins.unique_users}</div>
                        <div style={styles.miniStatLabel}>Unique</div>
                      </div>
                      <div style={styles.miniStat}>
                        <div style={{...styles.miniStatValue, color: '#e91e63'}}>{day.joins.women}</div>
                        <div style={styles.miniStatLabel}>Women</div>
                      </div>
                      <div style={styles.miniStat}>
                        <div style={{...styles.miniStatValue, color: '#2196f3'}}>{day.joins.men}</div>
                        <div style={styles.miniStatLabel}>Men</div>
                      </div>
                    </div>

                    {/* Class-wise joins */}
                    {day.joins.by_class.length > 0 && (
                      <div style={styles.classBreakdown}>
                        <div style={styles.classBreakdownTitle}>By Class:</div>
                        {day.joins.by_class.map((cls, idx) => (
                          <div key={idx} style={styles.classItem}>
                            <span style={styles.className}>
                              <span style={{fontFamily: 'monospace', color: '#666', fontSize: '12px', marginRight: '8px'}}>
                                #{cls.zyrax_class__id || 'N/A'}
                              </span>
                              {cls.zyrax_class__title}
                            </span>
                            <span style={styles.classCount}>
                              {cls.join_count} joins ({cls.unique_users} users)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Attendance Stats */}
                  <div style={styles.statsSection}>
                    <h5 style={styles.statsSubtitle}>✅ Attendance</h5>
                    <div style={styles.miniStatsGrid}>
                      <div style={styles.miniStat}>
                        <div style={styles.miniStatValue}>{day.attendance.total_attendance}</div>
                        <div style={styles.miniStatLabel}>Total</div>
                      </div>
                      <div style={styles.miniStat}>
                        <div style={styles.miniStatValue}>{day.attendance.unique_users}</div>
                        <div style={styles.miniStatLabel}>Unique</div>
                      </div>
                      <div style={styles.miniStat}>
                        <div style={{...styles.miniStatValue, color: '#e91e63'}}>{day.attendance.women}</div>
                        <div style={styles.miniStatLabel}>Women</div>
                      </div>
                      <div style={styles.miniStat}>
                        <div style={{...styles.miniStatValue, color: '#2196f3'}}>{day.attendance.men}</div>
                        <div style={styles.miniStatLabel}>Men</div>
                      </div>
                    </div>

                    {/* Class-wise attendance */}
                    {day.attendance.by_class.length > 0 && (
                      <div style={styles.classBreakdown}>
                        <div style={styles.classBreakdownTitle}>By Class:</div>
                        {day.attendance.by_class.map((cls, idx) => (
                          <div key={idx} style={styles.classItem}>
                            <span style={styles.className}>
                              <span style={{fontFamily: 'monospace', color: '#666', fontSize: '12px', marginRight: '8px'}}>
                                #{cls.zyrax_class__id || 'N/A'}
                              </span>
                              {cls.zyrax_class__title}
                            </span>
                            <span style={styles.classCount}>
                              {cls.attendance_count} records ({cls.unique_users} users)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div style={styles.noDataContainer}>
                <p>No daily breakdown data available for the selected date range.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <div style={styles.noDataContainer}>
          <p>No data available. Please select a date range and click Refresh.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  mainTitle: {
    color: '#333',
    margin: '0',
    fontSize: '28px',
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6c757d',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '25px',
  },
  sectionHeader: {
    marginBottom: '15px',
  },
  sectionTitle: {
    color: '#333',
    fontSize: '20px',
    marginBottom: '20px',
    marginTop: '0',
  },
  dateControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  quickSelectButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  quickButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  quickButtonActive: {
    backgroundColor: '#007bff',
    color: '#fff',
    borderColor: '#007bff',
  },
  dateInputs: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  dateInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  dateInput: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '150px',
  },
  refreshButton: {
    padding: '10px 25px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  noDataContainer: {
    textAlign: 'center',
    padding: '60px',
    color: '#999',
    fontStyle: 'italic',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '30px 20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dailyContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  dayCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#fafafa',
  },
  dayHeader: {
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  dayTitle: {
    margin: '0',
    color: '#333',
    fontSize: '18px',
  },
  statsSection: {
    marginBottom: '20px',
  },
  statsSubtitle: {
    margin: '0 0 10px 0',
    color: '#555',
    fontSize: '15px',
    fontWeight: '600',
  },
  miniStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '15px',
  },
  miniStat: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  miniStatValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  miniStatLabel: {
    fontSize: '11px',
    color: '#999',
    marginTop: '3px',
  },
  classBreakdown: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  classBreakdownTitle: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '600',
    marginBottom: '8px',
  },
  classItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  className: {
    fontSize: '13px',
    color: '#333',
    fontWeight: '500',
  },
  classCount: {
    fontSize: '12px',
    color: '#666',
  },
};

export default EverydayStats;
