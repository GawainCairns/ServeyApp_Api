USE `serveysdb`;

CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `servey_id` INT NOT NULL,
  `question` VARCHAR(500) NOT NULL,
  `type` VARCHAR(100) NOT NULL DEFAULT 'text',
  PRIMARY KEY (`id`),
  KEY `idx_servey_id` (`servey_id`),
  CONSTRAINT `fk_questions_servey` FOREIGN KEY (`servey_id`) REFERENCES `serveys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

