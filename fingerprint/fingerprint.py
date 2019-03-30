# -*- coding: utf-8 -*-

import re, string
from unidecode import unidecode

PUNCTUATION = re.compile('[%s]' % re.escape(string.punctuation))

class Fingerprinter(object):
    '''
    Python implementation of Google Refine fingerprinting algorithm described here:
    https://github.com/OpenRefine/OpenRefine/wiki/Clustering-In-Depth
    Requires the unidecode module: https://github.com/iki/unidecode
    '''
    def __init__(self, string, sorted=False):
        self.blacklist = set(line.strip() for line in open('blacklist.txt'))
        self.sorted = sorted
        string = str(string)
        self.string = self._preprocess(string)

    def _preprocess(self, string):
        '''
        Strip leading and trailing whitespace, lowercase the string, remove all punctuation,
        in that order.
        '''
        string = PUNCTUATION.sub(' ', string.strip().lower())
        string = self._remove_digits(string)
        string = self._remove_blacklisted_words(string)
        return string.strip()

    def _remove_blacklisted_words(self, string):
        return " ".join(filter(lambda s: s not in self.blacklist, string.split()))

    def _remove_digits(self, string):
        return "".join(filter(lambda c: c.isalpha() or c == " ", string))

    def _latinize(self, string):
        '''
        Replaces unicode characters with closest Latin equivalent. For example,
        Alejandro González Iñárritu becomes Alejando Gonzalez Inarritu.
        '''
        return unidecode(string)

    def _unique_preserving_order(self, seq):
        '''
        Returns unique tokens in a list, preserving order. Fastest version found in this
        exercise: http://www.peterbe.com/plog/uniqifiers-benchmark
        '''
        seen = set()
        seen_add = seen.add
        return [x for x in seq if not (x in seen or seen_add(x))]

    def get_words(self):
        if(self.sorted):
            return sorted(self.string.split())
        else:
            return self.string.split()
        
    def get_fingerprint(self):
        '''
        Gets conventional fingerpint.
        '''
        return self._latinize(' '.join(
            self._unique_preserving_order(
                self.get_words()
            )
        ))

def get_fingerprint(s):
    global sorted;
    return Fingerprinter(s, False).get_fingerprint()

def get_fingerprint_sorted(s):
    global sorted;
    return Fingerprinter(s, True).get_fingerprint()