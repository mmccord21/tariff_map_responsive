$(async function() {
    const geojsonData = await loadGeoData();
    const vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(geojsonData),
    });

    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        //style: styleFunction,
    });

    const map = new ol.Map({
        view: new ol.View({
            center: [0, 0],
            zoom: 1,
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
            }),
            vectorLayer,
        ],
        target: 'map',
    });
})

async function loadGeoData() {
    try {
        // The path is relative to your HTML file.
        const response = await fetch('data/countries.geojson');

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the JSON data from the response
        const geojsonData = await response.json();
        return geojsonData;

    } catch (error) {
        console.error('Could not fetch the GeoJSON data:', error);
        return {};
    }
}
