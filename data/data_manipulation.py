import geopandas as gpd

input_shp = "country_shp_file_stuff\World_Countries_Generalized.shp"
output_json = "countries.geojson"

# Read the shapefile into a GeoDataFrame
gdf = gpd.read_file(input_shp)

# You can now easily manipulate the data if needed!
# For example, to only keep countries in Africa:
# gdf = gdf[gdf['CONTINENT'] == 'Africa']

# Save the GeoDataFrame to a GeoJSON file
gdf.to_file(output_json, driver="GeoJSON")

print(f"Successfully converted with GeoPandas!")
