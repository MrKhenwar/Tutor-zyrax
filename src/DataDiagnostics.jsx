import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const DataDiagnostics = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Fetch all-time stats (last 90 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      const startDateStr = startDate.toISOString().split('T')[0];

      const response = await api.get(`/zyrax/analytics/everyday-stats/`, {
        params: {
          start_date: startDateStr,
          end_date: endDate
        }
      });

      diagnosticResults.tests.push({
        name: "Last 90 Days Analytics",
        status: "success",
        data: {
          total_joins: response.data.summary.total_joins,
          total_unique_users: response.data.summary.total_unique_users,
          total_attendance: response.data.summary.total_attendance_records,
          days_with_data: response.data.daily_stats.length,
          days_with_joins: response.data.daily_stats.filter(d => d.joins.total_joins > 0).length,
        },
        raw: response.data
      });

      // Find first day with data
      const firstDayWithJoins = response.data.daily_stats.find(d => d.joins.total_joins > 0);
      if (firstDayWithJoins) {
        diagnosticResults.tests.push({
          name: "First Day With Activity",
          status: "success",
          data: {
            date: firstDayWithJoins.date,
            total_joins: firstDayWithJoins.joins.total_joins,
            classes: firstDayWithJoins.joins.by_class.map(c => c.zyrax_class__title)
          }
        });
      }

      // Test 2: Fetch all classes
      const classesResponse = await api.get("/zyrax/classes/");
      diagnosticResults.tests.push({
        name: "Total Classes in System",
        status: "success",
        data: {
          total_classes: classesResponse.data.length,
          classes: classesResponse.data.map(c => ({
            id: c.id,
            title: c.title,
            date: c.class_date || c.date,
            time: c.time
          }))
        }
      });

    } catch (error) {
      diagnosticResults.tests.push({
        name: "Error",
        status: "error",
        error: error.message,
        details: error.response?.data
      });
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>🔍 Data Diagnostics</h2>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={styles.section}>
        <p>This tool helps diagnose data availability issues.</p>
        <button onClick={runDiagnostics} style={styles.runButton} disabled={loading}>
          {loading ? "Running..." : "🔍 Run Diagnostics"}
        </button>
      </div>

      {results && (
        <div style={styles.section}>
          <h3>Diagnostic Results</h3>
          <p style={styles.timestamp}>Run at: {new Date(results.timestamp).toLocaleString()}</p>

          {results.tests.map((test, idx) => (
            <div key={idx} style={styles.testResult}>
              <h4 style={styles.testName}>
                {test.status === 'success' ? '✅' : '❌'} {test.name}
              </h4>

              {test.status === 'success' && test.data && (
                <div style={styles.testData}>
                  <pre>{JSON.stringify(test.data, null, 2)}</pre>
                </div>
              )}

              {test.status === 'error' && (
                <div style={styles.errorData}>
                  <p><strong>Error:</strong> {test.error}</p>
                  {test.details && <pre>{JSON.stringify(test.details, null, 2)}</pre>}
                </div>
              )}

              {test.raw && (
                <details style={styles.details}>
                  <summary>View Raw API Response</summary>
                  <pre style={styles.rawData}>{JSON.stringify(test.raw, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
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
  runButton: {
    padding: '15px 30px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '15px',
  },
  timestamp: {
    color: '#666',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  testResult: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #dee2e6',
  },
  testName: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '18px',
  },
  testData: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    overflowX: 'auto',
  },
  errorData: {
    backgroundColor: '#f8d7da',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #f5c6cb',
    color: '#721c24',
  },
  details: {
    marginTop: '15px',
    cursor: 'pointer',
  },
  rawData: {
    marginTop: '10px',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    fontSize: '12px',
    maxHeight: '400px',
    overflow: 'auto',
  },
};

export default DataDiagnostics;
