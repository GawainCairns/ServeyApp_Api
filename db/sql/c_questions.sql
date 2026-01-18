USE `surveysdb`;

CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `survey_id` INT NOT NULL,
  `question` VARCHAR(500) NOT NULL,
  `type` VARCHAR(100) NOT NULL DEFAULT 'text',
  PRIMARY KEY (`id`),
  KEY `idx_survey_id` (`survey_id`),
  CONSTRAINT `fk_questions_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

