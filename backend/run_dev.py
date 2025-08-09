#!/usr/bin/env python3
"""
Development server runner with auto-reload.
"""

import uvicorn
import os
from pathlib import Path

def main():
    """Run the development server."""
    # Set environment variables
    os.environ.setdefault("ENVIRONMENT", "development")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main()
