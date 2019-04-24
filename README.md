# DVA6242_GroupProject

## Project

Download: https://drive.google.com/file/d/1UMfZhA5uuEmEDAyY7_4xBnaQLVsv_6rN/view?usp=sharing

Unzip the project, and navigate to it.

## Raw Unique Institution Names
Download: https://drive.google.com/file/d/1lKwpA3zjHrVqNqjMds_jAscbyeL4i-Qb/view?usp=sharing

## Clustering of the Institution Names

#### Requirements
* Python 3 with Packages: Numpy, Pandas and SKlearn
* Jupyter 

#### Steps
1. Navigate to `DVA6262_GrouProject/`
2. Run the clustering notebook via: `jupyter notebook clusters.ipynb`
3. Set the `input_filename` variable to the path to the unique institution names.
4. Set the `mapping_filename` and `label_filename` to anything. Make sure that the path to the files exist. 
4. Run the cells.

## Vizualization the results
#### Requirements
* A http server. [This](https://www.npmjs.com/package/http-server) was used when testing.
* A browser

#### Steps
1. Navigate to DVA6262_GrouProject/viz/
2. Start the http server. I.e `http-server`