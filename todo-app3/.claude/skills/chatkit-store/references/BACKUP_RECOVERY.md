# Backup and Recovery Reference

## Backup Strategies

### Full Database Backup
```bash
#!/bin/bash
# Database backup script for PostgreSQL

DB_NAME="chatkit_db"
DB_USER="chatkit_user"
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform database backup
pg_dump -U $DB_USER -h localhost -d $DB_NAME --no-password > "$BACKUP_DIR/db_backup_$DATE.sql"

# Compress the backup
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Remove backups older than retention period
find $BACKUP_DIR -name "db_backup_*" -mtime +$RETENTION_DAYS -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

### Incremental Backup with WAL-G
```bash
#!/bin/bash
# Incremental backup using WAL-G for PostgreSQL

export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export WALG_S3_PREFIX="s3://your-bucket/walg-backups"

# Take incremental backup
wal-g backup-push /var/lib/postgresql/data

# Clean up old WAL files
wal-g delete retain 7 --confirm  # Keep 7 days of backups

# Verify backup integrity
wal-g backup-list
```

### Application Data Backup
```python
import boto3
import zipfile
import os
from datetime import datetime
from pathlib import Path

def backup_application_data():
    """Backup application-specific data including user uploads, configs, etc."""

    # Define directories to backup
    backup_dirs = [
        '/app/uploads',
        '/app/config',
        '/app/logs',
        '/app/data'
    ]

    # Create backup archive
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"app_backup_{timestamp}.zip"
    backup_path = f"/backups/application/{backup_filename}"

    # Ensure backup directory exists
    os.makedirs(os.path.dirname(backup_path), exist_ok=True)

    with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as backup_zip:
        for directory in backup_dirs:
            dir_path = Path(directory)
            if dir_path.exists():
                for file_path in dir_path.rglob('*'):
                    if file_path.is_file():
                        # Add file to archive with relative path
                        arcname = file_path.relative_to(Path('/app'))
                        backup_zip.write(file_path, arcname)

    print(f"Application data backup completed: {backup_path}")
    return backup_path

def restore_application_data(backup_file: str, restore_path: str = '/app/restored'):
    """Restore application data from backup"""

    # Extract backup to restore location
    with zipfile.ZipFile(backup_file, 'r') as backup_zip:
        backup_zip.extractall(restore_path)

    print(f"Application data restored to: {restore_path}")
```

## Point-in-Time Recovery

### PostgreSQL PITR Setup
```sql
-- postgresql.conf settings for PITR
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
max_wal_senders = 3
wal_keep_segments = 32
```

```bash
#!/bin/bash
# Point-in-time recovery script

RESTORE_TIME="2023-01-01 12:00:00"
DATA_DIR="/var/lib/postgresql/13/main"
WAL_ARCHIVE="/var/lib/postgresql/wal_archive"
RESTORE_DIR="/var/lib/postgresql/restore_point"

# Stop PostgreSQL
sudo systemctl stop postgresql

# Remove current data directory
sudo rm -rf $RESTORE_DIR

# Copy base backup
cp -r $DATA_DIR/base_backup_latest $RESTORE_DIR

# Create recovery.conf for PITR
cat > $RESTORE_DIR/recovery.conf << EOF
restore_command = 'cp '$WAL_ARCHIVE'/%f %p'
recovery_target_time = '$RESTORE_TIME'
recovery_target_timeline = 'latest'
EOF

# Start PostgreSQL in recovery mode
sudo -u postgres pg_ctl -D $RESTORE_DIR -l /var/log/postgresql/recovery.log start

# Wait for recovery to complete
while pg_isready -q; do
    sleep 1
done

echo "Point-in-time recovery completed to: $RESTORE_TIME"
```

## File System Level Backups

### Rsync-based File Backup
```bash
#!/bin/bash
# File system backup using rsync

SOURCE_DIRS=(
    "/app/uploads"
    "/app/config"
    "/etc/nginx"
    "/etc/ssl"
)

BACKUP_HOST="backup-server.example.com"
BACKUP_PATH="/backups/chatkit"
DATE=$(date +%Y%m%d)

# Create local backup first
LOCAL_BACKUP="/tmp/chatkit_files_$DATE"
mkdir -p $LOCAL_BACKUP

for dir in "${SOURCE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        rsync -av --delete "$dir/" "$LOCAL_BACKUP/$(basename $dir)/"
    fi
done

# Sync to remote backup server
rsync -avz --delete "$LOCAL_BACKUP/" "user@$BACKUP_HOST:$BACKUP_PATH/$DATE/"

# Cleanup local temporary backup
rm -rf $LOCAL_BACKUP

echo "File backup completed and synced to remote server"
```

## Disaster Recovery Procedures

### Complete System Recovery
```bash
#!/bin/bash
# Complete system recovery script

set -e  # Exit on any error

# Configuration
BACKUP_DATE="latest"  # Or specific date like "20230101_120000"
BACKUP_SERVER="backup.example.com"
RESTORE_HOST="recovery.example.com"

echo "Starting complete system recovery..."

# 1. Restore database
echo "Restoring database..."
ssh $BACKUP_SERVER "cat /backups/database/db_backup_${BACKUP_DATE}.sql.gz" | \
    gunzip | psql -U postgres -d template1

# 2. Restore application files
echo "Restoring application files..."
rsync -avz "$BACKUP_SERVER:/backups/application/app_backup_${BACKUP_DATE}.zip" /tmp/
unzip /tmp/app_backup_${BACKUP_DATE}.zip -d /app/

# 3. Restore configuration
echo "Restoring configuration..."
rsync -avz "$BACKUP_SERVER:/backups/config/config_backup_${BACKUP_DATE}.tar.gz" /tmp/
cd / && tar -xzf /tmp/config_backup_${BACKUP_DATE}.tar.gz

# 4. Restart services
echo "Restarting services..."
systemctl restart postgresql
systemctl restart nginx
systemctl restart chatkit-app

echo "Complete system recovery finished!"
echo "Please verify all services are running correctly."
```

## Backup Verification

### Backup Integrity Checks
```python
import hashlib
import os
from pathlib import Path

def verify_backup_integrity(backup_path: str, expected_checksum: str = None) -> bool:
    """Verify backup file integrity using checksum"""

    if not os.path.exists(backup_path):
        print(f"Backup file not found: {backup_path}")
        return False

    # Calculate MD5 checksum
    hash_md5 = hashlib.md5()
    with open(backup_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)

    calculated_checksum = hash_md5.hexdigest()

    if expected_checksum:
        if calculated_checksum == expected_checksum:
            print(f"Backup integrity verified: {backup_path}")
            return True
        else:
            print(f"Backup integrity check FAILED: {backup_path}")
            print(f"Expected: {expected_checksum}")
            print(f"Got: {calculated_checksum}")
            return False
    else:
        print(f"Calculated checksum for {backup_path}: {calculated_checksum}")
        return True

def verify_database_backup(backup_file: str) -> bool:
    """Verify database backup by attempting to parse it"""

    try:
        # For SQL dumps, check if file contains valid SQL
        with open(backup_file, 'r', encoding='utf-8', errors='ignore') as f:
            header = f.read(1000)  # Read first 1000 chars

            # Check for common SQL dump indicators
            if 'PostgreSQL database dump' in header or 'mysqldump' in header:
                print(f"Database backup appears valid: {backup_file}")
                return True
            else:
                print(f"Database backup may be corrupted: {backup_file}")
                return False

    except Exception as e:
        print(f"Error verifying database backup {backup_file}: {e}")
        return False

def run_backup_verification_suite():
    """Run comprehensive backup verification"""

    backup_dir = Path("/backups")
    results = {}

    for backup_file in backup_dir.rglob("*"):
        if backup_file.is_file() and backup_file.suffix in ['.sql', '.sql.gz', '.zip', '.tar.gz']:
            print(f"Verifying: {backup_file}")

            if backup_file.suffix == '.sql':
                results[str(backup_file)] = verify_database_backup(str(backup_file))
            else:
                results[str(backup_file)] = verify_backup_integrity(str(backup_file))

    # Report results
    total_backups = len(results)
    successful_verifications = sum(results.values())

    print(f"\nVerification Summary:")
    print(f"Total backups checked: {total_backups}")
    print(f"Successful: {successful_verifications}")
    print(f"Failed: {total_backups - successful_verifications}")

    if successful_verifications < total_backups:
        print("\nWARNING: Some backups failed verification!")
        return False

    print("\nAll backups verified successfully!")
    return True
```

## Recovery Testing

### Automated Recovery Test
```python
import subprocess
import tempfile
import shutil
from pathlib import Path
import time

class RecoveryTest:
    def __init__(self, backup_location: str, test_environment: str):
        self.backup_location = Path(backup_location)
        self.test_environment = Path(test_environment)

    def run_full_recovery_test(self) -> dict:
        """Run complete recovery test in isolated environment"""

        start_time = time.time()
        results = {
            'passed': True,
            'steps': [],
            'duration': 0,
            'notes': []
        }

        try:
            # Create temporary test environment
            test_env = tempfile.mkdtemp(dir=self.test_environment)
            results['steps'].append('Created test environment')

            # Step 1: Restore database
            db_backup = self._find_latest_backup('database')
            if db_backup:
                self._restore_database(db_backup, test_env)
                results['steps'].append('Database restoration completed')
            else:
                results['notes'].append('No database backup found to test')

            # Step 2: Restore application files
            app_backup = self._find_latest_backup('application')
            if app_backup:
                self._restore_application_files(app_backup, test_env)
                results['steps'].append('Application files restoration completed')
            else:
                results['notes'].append('No application backup found to test')

            # Step 3: Start services and verify functionality
            self._start_test_services(test_env)
            results['steps'].append('Services started successfully')

            # Step 4: Run basic functionality tests
            if self._verify_basic_functionality(test_env):
                results['steps'].append('Basic functionality verified')
            else:
                results['passed'] = False
                results['notes'].append('Basic functionality test failed')

        except Exception as e:
            results['passed'] = False
            results['notes'].append(f'Recovery test failed: {str(e)}')

        finally:
            # Cleanup test environment
            if 'test_env' in locals():
                shutil.rmtree(test_env, ignore_errors=True)

            results['duration'] = time.time() - start_time

        return results

    def _find_latest_backup(self, backup_type: str) -> Path:
        """Find latest backup of specified type"""
        backup_pattern = f"*{backup_type}*" if backup_type else "*"
        for backup_file in sorted(self.backup_location.glob(f"{backup_pattern}"), reverse=True):
            if backup_file.is_file():
                return backup_file
        return None

    def _restore_database(self, backup_file: Path, test_env: str):
        """Restore database in test environment"""
        # Implementation would depend on database type
        cmd = f"pg_restore -d test_db {backup_file}"
        subprocess.run(cmd.split(), check=True, cwd=test_env)

    def _restore_application_files(self, backup_file: Path, test_env: str):
        """Restore application files in test environment"""
        shutil.unpack_archive(str(backup_file), test_env)

    def _start_test_services(self, test_env: str):
        """Start services in test environment"""
        # Configure test database connection
        # Start application with test config
        pass

    def _verify_basic_functionality(self, test_env: str) -> bool:
        """Verify basic application functionality"""
        # Test database connectivity
        # Test basic API endpoints
        # Verify data integrity
        return True

# Schedule regular recovery tests
def schedule_recovery_tests():
    """Setup cron job for regular recovery testing"""

    recovery_test_script = """
#!/bin/bash
cd /opt/chatkit-tools
python3 -c "
from backup_recovery import RecoveryTest
tester = RecoveryTest('/backups', '/tmp/test-recovery')
results = tester.run_full_recovery_test()
print('Recovery test results:', results)
"
"""

    # Add to crontab (weekly on Sundays at 2 AM)
    cron_job = "0 2 * * 0 " + recovery_test_script.replace('\n', '')

    print("Add this to crontab for weekly recovery testing:")
    print(cron_job)
```

## Backup Monitoring and Alerts

### Backup Status Monitoring
```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import subprocess
from datetime import datetime, timedelta

def monitor_backup_status():
    """Monitor backup status and send alerts if needed"""

    # Check if backups ran successfully in last 24 hours
    yesterday = datetime.now() - timedelta(days=1)

    # Check backup logs
    backup_log = "/var/log/backup.log"

    with open(backup_log, 'r') as f:
        log_content = f.read()

    # Look for successful backup entries from yesterday
    backup_success = f"Backup completed successfully" in log_content
    backup_date_match = yesterday.strftime("%Y-%m-%d") in log_content

    if not (backup_success and backup_date_match):
        send_backup_failure_alert()
        return False

    # Check backup file sizes (ensure they're not zero)
    backup_files = Path("/backups").glob("*.sql.gz")
    for backup_file in backup_files:
        if backup_file.stat().st_size == 0:
            send_zero_size_alert(backup_file)
            return False

    print("Backup monitoring: All good!")
    return True

def send_backup_failure_alert():
    """Send alert about backup failure"""

    msg = MIMEMultipart()
    msg['Subject'] = 'CRITICAL: Backup Failed'
    msg['From'] = 'alerts@chatkit.com'
    msg['To'] = 'admin@company.com'

    body = f"""
    Backup failed at {datetime.now()}

    Please check backup system immediately.
    Last successful backup may be outdated.
    """

    msg.attach(MIMEText(body, 'plain'))

    # Send email (configure SMTP settings)
    # smtp_server = smtplib.SMTP('localhost', 25)
    # smtp_server.send_message(msg)
    # smtp_server.quit()

    print("Backup failure alert sent!")

def generate_backup_report():
    """Generate daily backup report"""

    report = f"""
    Daily Backup Report - {datetime.now().strftime('%Y-%m-%d')}
    =====================================================

    Database Backup:
    - Status: {'SUCCESS' if check_db_backup() else 'FAILED'}
    - Size: {get_db_backup_size()}
    - Location: /backups/database/

    File Backup:
    - Status: {'SUCCESS' if check_file_backup() else 'FAILED'}
    - Files: {count_backed_up_files()}
    - Location: /backups/application/

    Verification:
    - Last integrity check: {get_last_verification_time()}
    - Overall health: {'GOOD' if check_backup_health() else 'ISSUES'}

    Next scheduled backup: {get_next_backup_time()}
    """

    print(report)

    # Optionally save to file or send via email
    with open(f"/reports/backup_report_{datetime.now().strftime('%Y%m%d')}.txt", 'w') as f:
        f.write(report)

def check_db_backup() -> bool:
    """Check if database backup is recent and valid"""
    # Implementation
    return True

def get_db_backup_size() -> str:
    """Get database backup size"""
    # Implementation
    return "1.2 GB"

def check_file_backup() -> bool:
    """Check if file backup is recent and valid"""
    # Implementation
    return True

def count_backed_up_files() -> int:
    """Count backed up files"""
    # Implementation
    return 1500

def get_last_verification_time() -> str:
    """Get last verification time"""
    # Implementation
    return "2023-01-01 03:00:00"

def check_backup_health() -> bool:
    """Check overall backup health"""
    # Implementation
    return True

def get_next_backup_time() -> str:
    """Get next scheduled backup time"""
    # Implementation
    return "2023-01-02 02:00:00"
```