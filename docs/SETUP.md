# SuperSix Setup Guide

## System Requirements

### Minimum Requirements
- **PHP**: 7.4+ (8.0+ recommended)
- **Database**: MySQL 5.7+ or MariaDB 10.3+
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **Browser**: Modern browser with JavaScript enabled

### PHP Extensions Required
- `pdo`
- `pdo_mysql`
- `json`
- `session`
- `mail` (for email verification)

### Recommended PHP Settings
```ini
session.gc_maxlifetime = 1440
session.cookie_lifetime = 0
memory_limit = 128M
max_execution_time = 30
```

---

## Installation Methods

### Option 1: Local Development (XAMPP/WAMP/MAMP)

#### Step 1: Download and Install XAMPP
1. Download [XAMPP](https://www.apachefriends.org/download.html)
2. Install and start Apache and MySQL services
3. Access phpMyAdmin at `http://localhost/phpmyadmin`

#### Step 2: Clone Repository
```bash
cd /path/to/xampp/htdocs
git clone https://github.com/yourusername/supersix.git
cd supersix
```

#### Step 3: Configure Database
1. Open phpMyAdmin
2. Create new database: `supersix`
3. Import database schema:
   ```sql
   # Import files in this order:
   database/tables/users.sql
   database/tables/boards.sql
   database/tables/tasks.sql
   database/tables/subtasks.sql
   ```

#### Step 4: Configure Application
```bash
cp config.example.php config.php
```

Edit `config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'supersix');
define('DB_USER', 'root');
define('DB_PASS', ''); // Usually empty for XAMPP
```

#### Step 5: Access Application
Open browser: `http://localhost/supersix`

### Option 2: Shared Hosting (cPanel)

#### Step 1: Upload Files
1. Download repository as ZIP or use Git (if available)
2. Extract files to your hosting account's public_html folder
3. Set proper file permissions (755 for directories, 644 for files)

#### Step 2: Create Database
1. Login to cPanel
2. Go to "MySQL Databases"
3. Create database (e.g., `username_supersix`)
4. Create database user and assign to database
5. Note the full database name, username, and password

#### Step 3: Import Database
1. Go to phpMyAdmin in cPanel
2. Select your database
3. Import the SQL files in order:
   - `database/tables/users.sql`
   - `database/tables/boards.sql` 
   - `database/tables/tasks.sql`
   - `database/tables/subtasks.sql`

#### Step 4: Configure Application
1. Rename `config.example.php` to `config.php`
2. Update database credentials:
```php
define('DB_HOST', 'localhost'); // or your host's database server
define('DB_NAME', 'username_supersix'); // your full database name
define('DB_USER', 'username_dbuser'); // your database username  
define('DB_PASS', 'your_password'); // your database password
```

### Option 3: VPS/Dedicated Server (Ubuntu)

#### Step 1: Install Dependencies
```bash
sudo apt update
sudo apt install apache2 mysql-server php php-mysql php-json php-session
sudo systemctl start apache2
sudo systemctl start mysql
sudo systemctl enable apache2
sudo systemctl enable mysql
```

#### Step 2: Configure MySQL
```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```

```sql
CREATE DATABASE supersix;
CREATE USER 'supersix_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON supersix.* TO 'supersix_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Deploy Application
```bash
cd /var/www/html
sudo git clone https://github.com/yourusername/supersix.git
sudo chown -R www-data:www-data supersix
sudo chmod -R 755 supersix
```

#### Step 4: Import Database
```bash
cd supersix
mysql -u supersix_user -p supersix < database/tables/users.sql
mysql -u supersix_user -p supersix < database/tables/boards.sql
mysql -u supersix_user -p supersix < database/tables/tasks.sql
mysql -u supersix_user -p supersix < database/tables/subtasks.sql
```

#### Step 5: Configure Application
```bash
cp config.example.php config.php
nano config.php
```

Update with your database credentials.

#### Step 6: Configure Apache (Optional)
Create virtual host `/etc/apache2/sites-available/supersix.conf`:
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html/supersix
    
    <Directory /var/www/html/supersix>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/supersix_error.log
    CustomLog ${APACHE_LOG_DIR}/supersix_access.log combined
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite supersix.conf
sudo systemctl reload apache2
```

---

## Database Schema

### Table Structure Overview
```
users
├── id (Primary Key)
├── username (Unique)
├── name
├── email (Unique)
├── password (Hashed)
├── email_verified
├── verification_token
└── dt_created

boards
├── id (Primary Key)
├── user_id (Foreign Key → users.id)
├── name
├── color
├── archived
└── created_at

tasks
├── id (Primary Key)
├── board_id (Foreign Key → boards.id)
├── title
├── description
├── status (active, queued, completed)
├── position
├── due_date
├── created_at
└── completed_at

subtasks
├── id (Primary Key)
├── task_id (Foreign Key → tasks.id)
├── title
├── completed
├── position
├── created_at
└── completed_at
```

---

## Configuration Options

### Database Configuration
Edit `config.php` for database settings:

```php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### Email Configuration
For email verification to work, ensure your server can send emails. Most shared hosts support this automatically.

For VPS/dedicated servers, you might need to configure mail:
```bash
sudo apt install postfix
# Follow configuration wizard
```

Or use a service like SendGrid, Mailgun, or Amazon SES (requires code modification).

### Session Configuration
PHP session settings in `php.ini` or `.htaccess`:
```ini
session.gc_maxlifetime = 2592000  ; 30 days
session.cookie_lifetime = 2592000 ; 30 days for "Remember Me"
```

---

## Security Setup

### File Permissions
```bash
# For Linux/Unix systems
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 600 config.php  # Extra security for config file
```

### .htaccess Security (Apache)
Create `.htaccess` in root directory:
```apache
# Prevent access to sensitive files
<Files "config.php">
    Order allow,deny
    Deny from all
</Files>

<Files "*.sql">
    Order allow,deny
    Deny from all
</Files>

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Force HTTPS (uncomment for production)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### SSL Certificate (Production)
For production deployments, always use HTTPS:
- Use Let's Encrypt for free SSL certificates
- Configure automatic renewal
- Update application URLs to use HTTPS

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: Database connection failed
```
**Solutions:**
1. Verify database credentials in `config.php`
2. Ensure MySQL service is running
3. Check if database exists
4. Verify user has proper permissions

#### PHP Errors
```
Error: Call to undefined function PDO::__construct()
```
**Solution:** Install PHP PDO extension:
```bash
sudo apt install php-mysql php-pdo
# or for CentOS/RHEL
sudo yum install php-mysql php-pdo
```

#### Session Issues
```
Error: Authentication required (keeps logging out)
```
**Solutions:**
1. Check PHP session configuration
2. Ensure cookies are enabled in browser
3. Verify session directory is writable
4. Check for conflicting session settings

#### File Permission Errors
```
Error: Failed to write session data
```
**Solution:** Fix file permissions:
```bash
sudo chown -R www-data:www-data /path/to/supersix
sudo chmod -R 755 /path/to/supersix
```

#### Email Verification Not Working
**Solutions:**
1. Check server mail configuration
2. Verify email doesn't go to spam folder
3. Check server mail logs
4. Consider using external email service

### Debug Mode
Add to `config.php` for debugging:
```php
// Debug mode (remove for production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
```

### Log Files
Check these locations for error logs:
- Apache: `/var/log/apache2/error.log`
- Nginx: `/var/log/nginx/error.log`
- PHP: `/var/log/php_errors.log`
- MySQL: `/var/log/mysql/error.log`

---

## Performance Optimization

### Database Optimization
1. **Indexes**: Ensure proper indexes exist (should be automatic from schema)
2. **Regular Maintenance**: 
   ```sql
   OPTIMIZE TABLE users, boards, tasks, subtasks;
   ```

### PHP Optimization
1. **OPcache**: Enable in `php.ini`:
   ```ini
   opcache.enable=1
   opcache.memory_consumption=128
   opcache.max_accelerated_files=4000
   ```

### Web Server Optimization
1. **Gzip Compression**: Enable in Apache/Nginx
2. **Browser Caching**: Set proper cache headers
3. **Static File Serving**: Serve images/CSS/JS directly through web server

---

## Backup Strategy

### Database Backups
```bash
# Daily backup script
mysqldump -u supersix_user -p supersix > backup_$(date +%Y%m%d).sql

# Automated backup (add to crontab)
0 2 * * * /usr/bin/mysqldump -u supersix_user -pYOUR_PASSWORD supersix > /backups/supersix_$(date +\%Y\%m\%d).sql
```

### File Backups
```bash
# Backup application files (excluding config.php)
tar -czf supersix_files_$(date +%Y%m%d).tar.gz --exclude='config.php' /path/to/supersix
```

---

## Production Deployment Checklist

- [ ] Use HTTPS (SSL certificate installed)
- [ ] Remove debug mode from `config.php`
- [ ] Set strong database passwords
- [ ] Configure proper file permissions
- [ ] Set up automated backups
- [ ] Configure email properly
- [ ] Enable error logging (but not display)
- [ ] Set up monitoring/uptime checks
- [ ] Configure firewall rules
- [ ] Test all functionality
- [ ] Set up log rotation
- [ ] Configure session security settings

---

## Support

If you encounter issues during setup:

1. Check the troubleshooting section above
2. Verify your system meets minimum requirements
3. Check server error logs
4. Ensure all file permissions are correct
5. Verify database connection and credentials

For additional support, check the project repository issues or create a new issue with:
- Your operating system and version
- PHP version (`php --version`)
- Web server type and version
- Complete error messages
- Steps to reproduce the issue