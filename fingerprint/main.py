from fingerprint import Fingerprinter, get_fingerprint, get_fingerprint_sorted
import pandas as pd
import numpy as np
import sys

if __name__ == '__main__':
    print("Loading File")
    input_file = sys.argv[1]

    sep = ","
    df = pd.read_csv(input_file, sep="\n", engine="python", error_bad_lines=False, quoting=3)

    print("Running Fingerprint")
    series = df.ix[:, 0].map(get_fingerprint).sort_values()
    series.sort_values(ascending=True, inplace=True)
    series_sorted = df.ix[:, 0].map(get_fingerprint_sorted).sort_values()
    series_sorted.sort_values(ascending=True, inplace=True)

    print("Save Results")
    pd.DataFrame(series[series.str.len() > 2].unique()).to_csv("orgs_unique.csv", sep=sep, index=False)
    pd.DataFrame(series_sorted[series_sorted.str.len() > 2].unique()).to_csv("orgs_unique_sorted.csv", sep=sep, index=False)
    pd.concat((df, series, series_sorted), axis=1).to_csv("orgs_mappings.csv", sep=sep, index=False)