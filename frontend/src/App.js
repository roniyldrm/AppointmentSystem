import { useEffect, useState } from "react";

function App() {
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState(null);
  const [provinceId, setProvinceId] = useState(0);

  useEffect(() => {
    if (!provinceId) return;
    
    fetch(`http://localhost:8080/api/hospitals/district/${provinceId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch districts");
        }
        return res.json();
      })
      .then((data) => setDistricts(data))
      .catch((err) => setError(err.message));
  }, [provinceId]);
  console.log(error)
/*   if (error) return <p>Error: {error}</p>;
  if (!districts.length) return <p>No districts found.</p>; */

  return (
    <>
    <input
        id="provinceInput"
        type="number"
        placeholder="Enter Province ID"
      />
    <button onClick={() => setProvinceId(document.getElementById("provinceInput").value)}> BAS </button>
    <h1>{provinceId}</h1>
    
    <ul>
      {districts ?
      (districts.map((district) => (
        <li key={district.id}>{district.name}</li>
      )))
      : 
      <p>No districts found.</p>}
    </ul>
    </>
  );
}

export default App