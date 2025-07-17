import React, { useEffect, useState } from 'react';

const MatchHeader = ({ match }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!match?.date || !match?.time) return;

    const [day, month] = match.date.split('/');
    const year = new Date().getFullYear();
    const matchDateTime = new Date(`${year}-${month}-${day}T${match.time}`);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = matchDateTime - now;

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        hours: isNaN(hours) ? 0 : hours,
        minutes: isNaN(minutes) ? 0 : minutes,
        seconds: isNaN(seconds) ? 0 : seconds
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [match]);

  if (!match) return null;

  return (
      <div style={{
        backgroundColor: '#25375f',
        color: 'white',
        padding: '2rem 1rem',
        textAlign: 'center',
        borderRadius: '10px',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}
          <div style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>hours&nbsp;&nbsp;&nbsp;minutes&nbsp;&nbsp;&nbsp;seconds</div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: '1rem',
          fontSize: '1rem'
        }}>
          <div>
            <div>{match.localteam.name}</div>
            <div>(0/0)</div>
          </div>
          <div>
            <div>{match.time}</div>
            <strong style={{ fontSize: '1.4rem' }}>
              {match.date.split('.').slice(0, 2).join('/')}
            </strong>
          </div>
          <div>
            <div>{match.awayteam.name}</div>
            <div>(0/0)</div>
          </div>
        </div>
      </div>
  );
};

const App = () => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetch('/data.json')
        .then(res => res.json())
        .then(json => {
            const matchArray = Array.isArray(json) ? json : json.data || [];
            setData(matchArray);
        })
        .catch(console.error);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    const filtered = data.filter(item => {
      const match = item?.matches?.match;
      const local = match?.localteam?.name?.toLowerCase() || '';
      const away = match?.awayteam?.name?.toLowerCase() || '';
      return (
          item.id.includes(value) ||
          local.includes(value.toLowerCase()) ||
          away.includes(value.toLowerCase())
      );
    });
    setSuggestions(filtered.slice(0, 5));
  };

  const selectMatch = (match) => {
    setSelectedMatch(match);
    const local = match?.matches?.match?.localteam?.name || 'Unknown';
    const away = match?.matches?.match?.awayteam?.name || 'Unknown';
    setQuery(`${match.id} - ${local} vs ${away}`);
    setSuggestions([]);
  };

  const getTypes = () => {
    return selectedMatch?.matches?.match?.odds?.type || [];
  };

  const getColumnNames = (type) => {
    const names = new Set();
    const bookmakers = Array.isArray(type.bookmaker) ? type.bookmaker : [type.bookmaker];
    bookmakers.forEach(b => {
      b?.odd?.forEach(o => names.add(o.name));
    });
    return Array.from(names);
  };

  const getRows = (type, columns) => {
    const rows = [];
    const bookmakers = Array.isArray(type.bookmaker) ? type.bookmaker : [type.bookmaker];
    bookmakers.forEach((b, i) => {
      const row = columns.map(col => {
        const odd = b?.odd?.find(o => o.name === col);
        return odd ? odd.value : '-';
      });
      rows.push(row);
    });
    return rows;
  };

  const Section = ({ title, columns, rows }) => {
    const [open, setOpen] = useState(true);
    return (
        <div style={{
          marginBottom: '2rem',
          borderRadius: '8px',
          backgroundColor: '#323d4f',
          color: 'white'
        }}>
          <div
              onClick={() => setOpen(!open)}
              style={{
                cursor: 'pointer',
                padding: '12px 20px',
                backgroundColor: '#080f23',
                borderBottom: '1px solid #333',
                fontWeight: 'bold',
                fontSize: '16px',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px'
              }}
          >
            ★ {title}
          </div>
          {open && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                <tr style={{ backgroundColor: '#080f23' }}>
                  {columns.map((col, i) => (
                      <th key={i} style={thStyle}>{col}</th>
                  ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, i) => (
                          <td key={i} style={tdStyle}>{cell}</td>
                      ))}
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </div>
    );
  };

  return (
      <div style={{ padding: '2rem', fontFamily: 'Arial', backgroundColor: '#090f1f', color: 'white', minHeight: '100vh' }}>
        <h2 style={{ marginBottom: '1rem' }}>Match Odds Viewer</h2>

        <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search by match ID or team"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #444',
              borderRadius: '5px',
              marginBottom: '1rem',
              backgroundColor: '#253044',
              color: 'white'
            }}
        />

        {suggestions.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {suggestions.map((match, index) => (
                  <li
                      key={`${match.id}-${index}`}
                      onClick={() => selectMatch(match)}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #444',
                        backgroundColor: '#080f23',
                        color: 'white'
                      }}
                  >
                    {match.id} - {match?.matches?.match?.localteam?.name || 'Unknown'} vs {match?.matches?.match?.awayteam?.name || 'Unknown'}
                  </li>
              ))}
            </ul>
        )}

        {selectedMatch && (
            <>
              <MatchHeader match={selectedMatch.matches.match} />
              <div style={{ marginTop: '2rem' }}>

                {getTypes().map((type, i) => {
                  const columns = getColumnNames(type);
                  const rows = getRows(type, columns);
                  return (
                      <Section
                          key={i}
                          title={type.value}
                          columns={columns}
                          rows={rows}
                      />
                  );
                })}
              </div>
            </>
        )}
      </div>
  );
};

const thStyle = {
  padding: '10px',
  borderBottom: '2px solid #000',
  backgroundColor: '#253044',
  color: '#f0f0f0',
  fontWeight: 'bold'
};

const tdStyle = {
  padding: '10px',
  border: '4px solid #000',
  color: '#ffc107',
  fontWeight: 'bold'
};

export default App;