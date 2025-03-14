def save_to_excel(results, excel_path=None):
    """
    Saves the scraped news data to an Excel file.

    Parameters:
    - results: A list of lists containing the news data to be saved.
    - excel_path: The file path where the Excel file will be saved. If None, a default path will be generated.

    Returns:
    - A tuple containing:
        - success: A boolean indicating if the save operation was successful.
        - path: The path of the saved Excel file.
        - path_changed: A boolean indicating if the path was changed during the save operation.
    """
    import os
    import pandas as pd
    from datetime import datetime

    try:
        original_path = excel_path  # Store the original requested path
        path_changed = False  # Flag to track if the path changes

        if excel_path is None:
            # Generate a default file name with the current timestamp
            now = datetime.now().strftime("%Y%m%d_%H%M%S")
            excel_path = f"news_results_{now}.xlsx"

        # Check if the directory exists and create it if it doesn't
        directory = os.path.dirname(excel_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)

        # Check if the file already exists and handle accordingly
        if os.path.exists(excel_path):
            try:
                # Attempt to open the file to check if it's in use
                with open(excel_path, 'a'):
                    pass
            except PermissionError:
                # If the file is in use, create a new file name
                file_name, file_ext = os.path.splitext(excel_path)
                now = datetime.now().strftime("%Y%m%d_%H%M%S")
                excel_path = f"{file_name}_{now}{file_ext}"
                path_changed = True

        # Create a DataFrame from the results
        df = pd.DataFrame(results, columns=["Keyword", "Title", "Source", "Summary", "URL"])

        # Save the DataFrame to an Excel file
        df.to_excel(excel_path, index=False, engine='openpyxl')

        return True, excel_path, path_changed
    except Exception as e:
        return False, None, path_changed  # Return failure if an exception occurs