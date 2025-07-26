#!/usr/bin/env python
"""
Script to make the backup file downloadable
"""
import os
import shutil
import json

def make_backup_downloadable():
    """
    Copy the backup file to a location where it can be downloaded
    """
    print("📥 Making backup file downloadable...")
    
    source_file = "render_data_backup.json"
    
    if os.path.exists(source_file):
        # Copy to static files directory
        static_dir = "staticfiles"
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
        
        destination = os.path.join(static_dir, "render_data_backup.json")
        shutil.copy2(source_file, destination)
        
        print(f"✅ Backup file copied to: {destination}")
        print(f"📁 File size: {os.path.getsize(destination) / 1024:.2f} KB")
        print(f"🔗 You can download it from: /static/render_data_backup.json")
        
        # Also create a simple HTML page to download
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Backup File Download</title>
        </head>
        <body>
            <h1>Database Backup File</h1>
            <p>File size: {os.path.getsize(destination) / 1024:.2f} KB</p>
            <a href="/static/render_data_backup.json" download>Download render_data_backup.json</a>
        </body>
        </html>
        """
        
        with open(os.path.join(static_dir, "download.html"), "w") as f:
            f.write(html_content)
        
        print("✅ Download page created at: /static/download.html")
        
    else:
        print("❌ Backup file not found!")

if __name__ == "__main__":
    make_backup_downloadable() 