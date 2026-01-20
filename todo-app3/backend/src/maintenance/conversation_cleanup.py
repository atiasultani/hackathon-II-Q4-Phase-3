"""
Maintenance script for cleaning up old conversations based on retention policy.
According to requirements: conversations are retained for 2 years.
"""

import schedule
import time
import threading
from datetime import datetime
from sqlmodel import Session
from ..utils.database import engine
from ..services.database_service import DatabaseService


def run_cleanup():
    """
    Execute the conversation cleanup based on retention policy.
    Removes conversations and their associated messages older than 2 years.
    """
    print(f"[{datetime.now()}] Starting conversation cleanup...")

    # Create a new database session for this operation
    with Session(engine) as session:
        db_service = DatabaseService(session)

        # Clean up conversations older than 2 years (730 days)
        deleted_count = db_service.cleanup_old_conversations(days_old=730)

        print(f"[{datetime.now()}] Cleanup completed. Removed {deleted_count} old conversations.")


def start_scheduler():
    """
    Start the scheduler in a background thread.
    Runs the cleanup daily at 2:00 AM.
    """
    # Schedule the cleanup to run daily at 2:00 AM
    schedule.every().day.at("02:00").do(run_cleanup)

    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    # Start the scheduler in a background thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()

    print(f"[{datetime.now()}] Conversation cleanup scheduler started. Next run scheduled for 2:00 AM.")


def run_cleanup_once():
    """
    Run the cleanup immediately (for manual execution or testing).
    """
    run_cleanup()


if __name__ == "__main__":
    # If run directly, execute cleanup once
    run_cleanup_once()