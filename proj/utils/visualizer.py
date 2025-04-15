import json

def format_db_structure_for_visualization(db_agent):
    """
    Formats the database structure into a JSON format suitable for the visualization component.
    
    Args:
        db_agent: An instance of DatabaseAgent with tools initialized
        
    Returns:
        dict: A JSON-serializable dictionary with the database structure
    """
    result = {
        "schemas": [],
        "tables": {}
    }

    # Get schemas
    try:
        result["schemas"] = db_agent.tools.list_schemas()
    except Exception as e:
        print(f"Error fetching schemas: {e}")
        result["schemas"] = []

    # Focus on public schema for now
    schema = "public"

    try:
        tables = db_agent.tools.list_tables(schema=schema)

        for table_name in tables:
            try:
                # Get table structure
                table_info = db_agent.tools.describe_table(table_name=table_name, schema=schema)

                # Get sample data
                sample_data = db_agent.tools.preview_data(table_name=table_name, schema=schema, limit=3)

                processed_sample = []
                for row in sample_data:
                    processed_row = {}
                    for key, value in row.items():
                        processed_row[key] = str(value) if value is not None else None
                    processed_sample.append(processed_row)

                result["tables"][table_name] = {
                    "structure": table_info,
                    "sample_data": processed_sample
                }

            except Exception as e:
                print(f"Error processing table {table_name}: {e}")
                result["tables"][table_name] = {"error": str(e)}

    except Exception as e:
        print(f"Error fetching tables: {e}")

    return result


def get_db_structure_json(db_agent):
    """
    Converts the database structure into a pretty-printed JSON string.
    
    Args:
        db_agent: An instance of DatabaseAgent with tools initialized
        
    Returns:
        str: JSON string
    """
    db_structure = format_db_structure_for_visualization(db_agent)
    return json.dumps(db_structure, indent=2)

