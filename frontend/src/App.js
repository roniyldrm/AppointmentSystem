import { useEffect, useState } from "react";

function App() {
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState(null);
  let provinceId = 40;

  useEffect(() => {
    if (!provinceId) return;

    fetch(`http://localhost:8080/api/districts?provinceId=${provinceId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch districts");
        }
        return res.json();
      })
      .then((data) => setDistricts(data))
      .catch((err) => setError(err.message));
  }, [provinceId]);

  if (error) return <p>Error: {error}</p>;
  if (!districts.length) return <p>No districts found.</p>;

  return (
    <ul>
      {districts.map((district) => (
        <li key={district.id}>{district.name}</li>
      ))}
    </ul>
  );
}

export default App;