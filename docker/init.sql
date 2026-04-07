-- MySQL initialization script
-- Creates the database and grants permissions

CREATE DATABASE IF NOT EXISTS poemquizzer;
USE poemquizzer;

-- Grant all privileges to root user (for development)
GRANT ALL PRIVILEGES ON poemquizzer.* TO 'root'@'%';
FLUSH PRIVILEGES;
