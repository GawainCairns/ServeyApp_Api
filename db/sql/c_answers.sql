USE `serveysdb`;

CREATE TABLE IF NOT EXISTS `answers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `question_id` INT NOT NULL,
  `answer` VARCHAR(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_question_id` (`question_id`),
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;