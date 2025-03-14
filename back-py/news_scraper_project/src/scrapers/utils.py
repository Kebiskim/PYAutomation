# Contents of the file: /news_scraper_project/news_scraper_project/src/scrapers/utils.py

def clean_article_data(article):
    """
    Clean and format the scraped article data.

    Parameters:
    - article: A dictionary containing the raw data of a news article.

    Returns:
    - A cleaned dictionary with formatted data.
    """
    cleaned_article = {
        "keyword": article.get("keyword", "").strip(),
        "title": article.get("title", "").strip(),
        "press": article.get("press", "").strip(),
        "summary": article.get("summary", "").strip(),
        "url": article.get("url", "").strip()
    }
    return cleaned_article

def format_articles_for_export(articles):
    """
    Format a list of articles for exporting to Excel.

    Parameters:
    - articles: A list of dictionaries containing article data.

    Returns:
    - A list of lists, where each inner list represents an article's data.
    """
    formatted_articles = []
    for article in articles:
        formatted_articles.append([
            article["keyword"],
            article["title"],
            article["press"],
            article["summary"],
            article["url"]
        ])
    return formatted_articles