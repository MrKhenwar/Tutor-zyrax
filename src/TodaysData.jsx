import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const TodaysData = () => {
  const navigate = useNavigate();
  const [todayStats, setTodayStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch today's detailed attendance data with user and class information
  const fetchTodaysData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch detailed attendance with user information separated by platform
      const response = await api.get(`/zyrax/analytics/todays-detailed-attendance/`);

      if (response.data) {
        setTodayStats(response.data);
      } else {
        // No data for today
        setTodayStats({
          date: new Date().toISOString().split('T')[0],
          zyrax: {
            total_users: 0,
            total_attendance: 0,
            users: [],
            classes: []
          },
          zylo: {
            total_users: 0,
            total_attendance: 0,
            users: [],
            classes: []
          }
        });
      }
    } catch (err) {
      console.error('Error fetching today\'s data:', err);
      setError(`Failed to fetch data: ${err.response?.data?.detail || err.message}`);
      setTodayStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchTodaysData();
    const interval = setInterval(fetchTodaysData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchTodaysData]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.mainTitle}>📅 Today's Attendance Data</h2>
          <p style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={fetchTodaysData} style={styles.refreshButton} disabled={loading}>
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading && !todayStats ? (
        <div style={styles.loadingContainer}>
          <p>Loading today's data...</p>
        </div>
      ) : todayStats ? (
        <>
          {/* Summary Stats */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>📊 Today's Summary</h3>
            <div style={styles.statsGrid}>
              <div style={{...styles.statCard, backgroundColor: '#e3f2fd'}}>
                <div style={styles.statValue}>
                  {(todayStats.zyrax?.total_attendance || 0) + (todayStats.zylo?.total_attendance || 0)}
                </div>
                <div style={styles.statLabel}>Total Attendance</div>
                <div style={styles.platformBreakdown}>
                  <span style={styles.zyraxBadge}>Zyrax: {todayStats.zyrax?.total_attendance || 0}</span>
                  <span style={styles.zyloBadge}>Zylo: {todayStats.zylo?.total_attendance || 0}</span>
                </div>
              </div>
              <div style={{...styles.statCard, backgroundColor: '#f3e5f5'}}>
                <div style={styles.statValue}>
                  {(todayStats.zyrax?.total_users || 0) + (todayStats.zylo?.total_users || 0)}
                </div>
                <div style={styles.statLabel}>Total Unique Users</div>
                <div style={styles.platformBreakdown}>
                  <span style={styles.zyraxBadge}>Zyrax: {todayStats.zyrax?.total_users || 0}</span>
                  <span style={styles.zyloBadge}>Zylo: {todayStats.zylo?.total_users || 0}</span>
                </div>
              </div>
              <div style={{...styles.statCard, backgroundColor: '#e8f5e9'}}>
                <div style={styles.statValue}>{todayStats.zyrax?.classes?.length || 0}</div>
                <div style={styles.statLabel}>Zyrax Classes</div>
              </div>
              <div style={{...styles.statCard, backgroundColor: '#fff3e0'}}>
                <div style={styles.statValue}>{todayStats.zylo?.classes?.length || 0}</div>
                <div style={styles.statLabel}>Zylo Classes</div>
              </div>
            </div>
          </section>

          {/* Zyrax Users Who Attended Today */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>👥 Zyrax Users Who Attended Today ({todayStats.zyrax?.total_users || 0})</h3>
            {todayStats.zyrax?.users && todayStats.zyrax.users.length > 0 ? (
              <div style={styles.usersGrid}>
                {todayStats.zyrax.users.map((user) => (
                  <div key={user.user_id} style={styles.userCard}>
                    <div style={styles.userIcon}>👤</div>
                    <div style={styles.userName}>{user.full_name || `${user.first_name} ${user.last_name}`.trim()}</div>
                    <div style={styles.userUsername}>@{user.username}</div>
                    <div style={{...styles.userPlatform, backgroundColor: '#007bff'}}>Zyrax</div>
                    <div style={styles.userClassCount}>
                      {user.classes.length} {user.classes.length === 1 ? 'class' : 'classes'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zyrax users attended classes today yet.</div>
            )}
          </section>

          {/* Zylo Users Who Attended Today */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>👥 Zylo Users Who Attended Today ({todayStats.zylo?.total_users || 0})</h3>
            {todayStats.zylo?.users && todayStats.zylo.users.length > 0 ? (
              <div style={styles.usersGrid}>
                {todayStats.zylo.users.map((user) => (
                  <div key={user.user_id} style={styles.userCard}>
                    <div style={styles.userIcon}>👤</div>
                    <div style={styles.userName}>{user.full_name || `${user.first_name} ${user.last_name}`.trim()}</div>
                    <div style={styles.userUsername}>@{user.username}</div>
                    <div style={{...styles.userPlatform, backgroundColor: '#ff9800'}}>Zylo</div>
                    <div style={styles.userClassCount}>
                      {user.classes.length} {user.classes.length === 1 ? 'class' : 'classes'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zylo users attended classes today yet.</div>
            )}
          </section>

          {/* Zyrax Classes */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🧘 Zyrax Classes (Yoga/Zumba)</h3>
            {todayStats.zyrax?.classes && todayStats.zyrax.classes.length > 0 ? (
              <div style={styles.classesContainer}>
                {todayStats.zyrax.classes.map((cls, index) => (
                  <div key={index} style={styles.classCard}>
                    <div style={styles.classHeader}>
                      <div style={styles.classTitle}>
                        <span style={styles.classId}>#{cls.class_id}</span>
                        {cls.class_title}
                      </div>
                      <div style={styles.classTime}>{cls.class_time}</div>
                    </div>
                    <div style={styles.classStats}>
                      <div style={styles.classStatItem}>
                        <span style={styles.classStatValue}>{cls.attendance_count}</span>
                        <span style={styles.classStatLabel}>Attendance</span>
                      </div>
                      <div style={styles.classStatItem}>
                        <span style={styles.classStatValue}>{cls.users.length}</span>
                        <span style={styles.classStatLabel}>Unique Users</span>
                      </div>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min((cls.attendance_count / 20) * 100, 100)}%`
                        }}
                      />
                    </div>

                    {/* Users who attended this class */}
                    {cls.users.length > 0 && (
                      <div style={styles.classUsersSection}>
                        <div style={styles.classUsersTitle}>Users who attended:</div>
                        <div style={styles.classUsersList}>
                          {cls.users.map((user, userIndex) => (
                            <div key={userIndex} style={styles.classUserBadge}>
                              <span style={styles.classUserName}>{user.full_name}</span>
                              <span style={styles.classUserUsername}>@{user.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zyrax classes attended today.</div>
            )}
          </section>

          {/* Zylo Classes */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>💪 Zylo Classes (Fitness)</h3>
            {todayStats.zylo?.classes && todayStats.zylo.classes.length > 0 ? (
              <div style={styles.classesContainer}>
                {todayStats.zylo.classes.map((cls, index) => (
                  <div key={index} style={styles.classCard}>
                    <div style={styles.classHeader}>
                      <div style={styles.classTitle}>
                        <span style={styles.classId}>#{cls.class_id}</span>
                        {cls.class_title}
                      </div>
                      <div style={styles.classTime}>{cls.class_time}</div>
                    </div>
                    <div style={styles.classStats}>
                      <div style={styles.classStatItem}>
                        <span style={styles.classStatValue}>{cls.attendance_count}</span>
                        <span style={styles.classStatLabel}>Attendance</span>
                      </div>
                      <div style={styles.classStatItem}>
                        <span style={styles.classStatValue}>{cls.users.length}</span>
                        <span style={styles.classStatLabel}>Unique Users</span>
                      </div>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min((cls.attendance_count / 20) * 100, 100)}%`,
                          backgroundColor: '#ff9800'
                        }}
                      />
                    </div>

                    {/* Users who attended this class */}
                    {cls.users.length > 0 && (
                      <div style={styles.classUsersSection}>
                        <div style={styles.classUsersTitle}>Users who attended:</div>
                        <div style={styles.classUsersList}>
                          {cls.users.map((user, userIndex) => (
                            <div key={userIndex} style={{...styles.classUserBadge, backgroundColor: '#fff3e0'}}>
                              <span style={styles.classUserName}>{user.full_name}</span>
                              <span style={styles.classUserUsername}>@{user.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zylo classes attended today.</div>
            )}
          </section>

          {/* Most Popular Classes Today */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🔥 Most Popular Classes Today</h3>
            {(() => {
              // Combine classes from both platforms
              const allClasses = [
                ...(todayStats.zyrax?.classes || []).map(cls => ({...cls, platform: 'Zyrax'})),
                ...(todayStats.zylo?.classes || []).map(cls => ({...cls, platform: 'Zylo'}))
              ];

              return allClasses.length > 0 ? (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Class ID</th>
                        <th style={styles.th}>Class Title</th>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Platform</th>
                        <th style={styles.th}>Attendance</th>
                        <th style={styles.th}>Unique Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allClasses
                        .sort((a, b) => b.attendance_count - a.attendance_count)
                        .map((cls, index) => (
                          <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.rankBadge,
                                backgroundColor: index === 0 ? '#ffd700' :
                                                 index === 1 ? '#c0c0c0' :
                                                 index === 2 ? '#cd7f32' : '#007bff'
                              }}>
                                {index + 1}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{fontFamily: 'monospace', color: '#666'}}>
                                #{cls.class_id}
                              </span>
                            </td>
                            <td style={styles.td}>{cls.class_title}</td>
                            <td style={styles.td}>{cls.class_time}</td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.platformBadgeSmall,
                                backgroundColor: cls.platform === 'Zyrax' ? '#007bff' : '#ff9800'
                              }}>
                                {cls.platform}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <strong>{cls.attendance_count}</strong>
                            </td>
                            <td style={styles.td}>{cls.users.length}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.noData}>No class data available for today.</div>
              );
            })()}
          </section>
        </>
      ) : (
        <div style={styles.noDataContainer}>
          <p>No data available for today. Please try refreshing.</p>
        </div>
      )}

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Auto-refreshes every 5 minutes • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px',
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  mainTitle: {
    color: '#333',
    margin: '0 0 5px 0',
    fontSize: '32px',
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
    margin: '0',
    fontSize: '16px',
    fontWeight: '400',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  refreshButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  backButton: {
    padding: '12px 24px',
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
  sectionTitle: {
    color: '#333',
    fontSize: '22px',
    marginBottom: '20px',
    marginTop: '0',
    fontWeight: '600',
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    color: '#666',
  },
  noDataContainer: {
    textAlign: 'center',
    padding: '80px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '30px 20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  statValue: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
  },
  platformBreakdown: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '12px',
  },
  zyraxBadge: {
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: '#fff',
    fontWeight: '600',
  },
  zyloBadge: {
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#ff9800',
    color: '#fff',
    fontWeight: '600',
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '15px',
  },
  userCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center',
    transition: 'all 0.2s',
    cursor: 'default',
  },
  userIcon: {
    fontSize: '36px',
    marginBottom: '10px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  userUsername: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  userPlatform: {
    fontSize: '11px',
    color: '#fff',
    backgroundColor: '#007bff',
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-block',
    fontWeight: '600',
  },
  userClassCount: {
    fontSize: '11px',
    color: '#666',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  classesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  classCard: {
    backgroundColor: '#fafafa',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s',
  },
  classHeader: {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e0e0e0',
  },
  classTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  classId: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#999',
    marginRight: '8px',
  },
  classTime: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  classStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '15px',
  },
  classStatItem: {
    textAlign: 'center',
  },
  classStatValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  classStatLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: '3px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontStyle: 'italic',
    fontSize: '15px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#495057',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
    color: '#212529',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#f8f9fa',
  },
  rankBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  platformBadgeSmall: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#fff',
    fontWeight: '600',
    display: 'inline-block',
  },
  classUsersSection: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0',
  },
  classUsersTitle: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '600',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  classUsersList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  classUserBadge: {
    backgroundColor: '#e3f2fd',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    border: '1px solid #90caf9',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  classUserName: {
    fontWeight: '600',
    color: '#333',
  },
  classUserUsername: {
    color: '#666',
    fontSize: '11px',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    marginTop: '20px',
  },
  footerText: {
    color: '#999',
    fontSize: '13px',
    margin: '0',
  },
};

export default TodaysData;
