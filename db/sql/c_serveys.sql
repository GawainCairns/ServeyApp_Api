USE `serveysdb`;

CREATE TABLE `serveys` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) DEFAULT NULL,
    `discription` varchar(2000) DEFAULT NULL,
    `creator` int NOT NULL,
    `s_code` varchar(64) NOT NULL,
    PRIMARY KEY (`id`)
    , UNIQUE KEY `uniq_s_code` (`s_code`)
    , CHECK (CHAR_LENGTH(`s_code`) >= 10)
)