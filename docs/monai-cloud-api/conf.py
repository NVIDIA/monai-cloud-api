# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
import os

from docutils import nodes
from sphinx import search

# import sys
# sys.path.insert(0, os.path.abspath('.'))


# -- Project information -----------------------------------------------------

project = 'NVIDIA MONAI Cloud APIs'
copyright = '2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved'
author = 'NVIDIA'

# The full version, including alpha/beta/rc tags
release = 'v0.1.0'

# maintain left-side bar toctrees in `contents` file
# so it doesn't show up needlessly in the index page
master_doc = "contents"


# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    "ablog",
    "myst_nb",
    "sphinx_copybutton",
    "sphinx_design",
    "sphinx-prompt",
    "sphinx_tabs.tabs",
    "sphinx_sitemap"
]

suppress_warnings = ["myst.domains", "ref.ref"]

numfig = True

# final location of docs for seo/sitemap
html_baseurl = 'https://docs.nvidia.com/monai-cloud-api/0.1.0/' # FIXME # FIXED for now; needs to be updated at the time of product launch

# final location of the framework signup/info website
monai_cloud_api_info_url = 'https://www.nvidia.com/en-us/clara/monai/' # FIXME

myst_enable_extensions = [
    "dollarmath",
    "amsmath",
    "deflist",
    "colon_fence",
    "replacements",
    'substitution'
]
myst_heading_anchors = 4

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = [
    "_build",
    ".DS_Store"
]


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  Refer to the documentation for
# a list of builtin themes.
#
html_theme = "sphinx_book_theme"
html_logo = "_static/nvidia-logo-horiz-rgb-blk-for-screen.png"
html_title = "NVIDIA MONAI Cloud APIs"
html_short_title = "MONAI Cloud APIs"
html_copy_source = True
html_sourcelink_suffix = ""
html_favicon = "_static/nvidia-logo-vert-rgb-blk-for-screen.png"
html_last_updated_fmt = ""
html_additional_files = ["index.html"]

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']
html_css_files = ["custom.css"]

html_theme_options = {
    "path_to_docs": "docs",
    "use_edit_page_button": False,
    "use_issues_button": False,
    "use_repository_button": False,
    "use_download_button": False,
    "logo_only": False,
    "show_toc_level": 4,
    "extra_navbar": "",
    "extra_footer": "",
}

version_short = release
myst_substitutions = {
    "version_num": version_short,
    "monai_cloud_api_info_url": f"[information website]({monai_cloud_api_info_url})"
}


def ultimateReplace(app, docname, source):
    result = source[0]
    for key in app.config.ultimate_replacements:
        result = result.replace(key, app.config.ultimate_replacements[key])
    source[0] = result


# this is a necessary hack to allow us to fill in variables that exist in code blocks
ultimate_replacements = {
    "{version_num}": version_short
}

def setup(app):
    app.add_config_value('ultimate_replacements', {}, True)
    app.connect('source-read', ultimateReplace)
    app.add_js_file("https://js.hcaptcha.com/1/api.js")

    visitor_script = "//assets.adobedtm.com/5d4962a43b79/c1061d2c5e7b/launch-191c2462b890.min.js"

    if visitor_script:
        app.add_js_file(visitor_script)

# Patch for sphinx.search stemming short terms (that is, tts -> tt)
# https://github.com/sphinx-doc/sphinx/blob/4.5.x/sphinx/search/__init__.py#L380
def sphinxSearchIndexFeed(self, docname: str, filename: str, title: str, doctree: nodes.document):
    """Feed a doctree to the index."""
    self._titles[docname] = title
    self._filenames[docname] = filename

    visitor = search.WordCollector(doctree, self.lang)
    doctree.walk(visitor)

    # memoize self.lang.stem
    def stem(word: str) -> str:
        try:
            return self._stem_cache[word]
        except KeyError:
            self._stem_cache[word] = self.lang.stem(word).lower()
            return self._stem_cache[word]

    _filter = self.lang.word_filter

    for word in visitor.found_title_words:
        stemmed_word = stem(word)
        if len(stemmed_word) > 3 and _filter(stemmed_word):
            self._title_mapping.setdefault(stemmed_word, set()).add(docname)
        elif _filter(word):  # stemmer must not remove words from search index
            self._title_mapping.setdefault(word.lower(), set()).add(docname)

    for word in visitor.found_words:
        stemmed_word = stem(word)
        # again, stemmer must not remove words from search index
        if len(stemmed_word) <= 3 or not _filter(stemmed_word) and _filter(word):
            stemmed_word = word.lower()
        already_indexed = docname in self._title_mapping.get(stemmed_word, set())
        if _filter(stemmed_word) and not already_indexed:
            self._mapping.setdefault(stemmed_word, set()).add(docname)


search.IndexBuilder.feed = sphinxSearchIndexFeed
