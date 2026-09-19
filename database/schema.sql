-- =============================================
-- StudyFlow Database Schema
-- Run this in MySQL Workbench to set up the DB
-- =============================================

CREATE DATABASE IF NOT EXISTS studyflow_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE studyflow_db;

CREATE TABLE IF NOT EXISTS tasks (
    id           INT            NOT NULL AUTO_INCREMENT,
    title        VARCHAR(255)   NOT NULL,
    description  TEXT           DEFAULT NULL,
    category     ENUM(
                     'study',
                     'personal',
                     'health',
                     'work',
                     'other'
                 )              NOT NULL DEFAULT 'other',
    priority     ENUM(
                     'high',
                     'medium',
                     'low'
                 )              NOT NULL DEFAULT 'medium',
    due_date     DATE           DEFAULT NULL,
    due_time     TIME           DEFAULT NULL,
    is_completed TINYINT(1)     NOT NULL DEFAULT 0,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_category     (category),
    INDEX idx_priority     (priority),
    INDEX idx_is_completed (is_completed),
    INDEX idx_due_date     (due_date),
    INDEX idx_created_at   (created_at)
);

-- Sample seed data
INSERT INTO tasks
    (title, description, category, priority, due_date, due_time, is_completed)
VALUES
    ('Complete Math Assignment', 'Chapter 5 exercises', 'study', 'high', CURDATE(), '18:00:00', 0),
    ('Morning Workout', '30 minutes cardio', 'health', 'medium', CURDATE(), '07:00:00', 0),
    ('Read Physics Textbook', 'Pages 120 to 145', 'study', 'medium', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '20:00:00', 0);