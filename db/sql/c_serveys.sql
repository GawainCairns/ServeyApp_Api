USE `serveysdb`;

CREATE TABLE `serveys` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) DEFAULT NULL,
    `discription` varchar(2000) DEFAULT NULL,
    `creator` int NOT NULL,
    PRIMARY KEY (`id`)
)