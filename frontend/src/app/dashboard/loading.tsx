export default function DashboardLoading() {
  return (
    <div className="flex-col gap-lg" aria-busy="true" aria-live="polite">
      <div className="page-header">
        <div className="page-header-left">
          <div className="skeleton" style={{ width: 220, height: 28 }} />
          <div className="skeleton mt-md" style={{ width: 320, height: 14 }} />
        </div>
      </div>

      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`stat-${idx}`} className="stat-card">
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)' }} />
            <div className="flex-col gap-xs">
              <div className="skeleton" style={{ width: 120, height: 12 }} />
              <div className="skeleton" style={{ width: 70, height: 24 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table aria-hidden="true">
            <thead>
              <tr>
                <th>Loading</th>
                <th>Loading</th>
                <th>Loading</th>
                <th>Loading</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`row-${idx}`}>
                  <td><div className="skeleton" style={{ width: '80%', height: 12 }} /></td>
                  <td><div className="skeleton" style={{ width: '75%', height: 12 }} /></td>
                  <td><div className="skeleton" style={{ width: 90, height: 20, borderRadius: 999 }} /></td>
                  <td><div className="skeleton" style={{ width: 110, height: 12 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
