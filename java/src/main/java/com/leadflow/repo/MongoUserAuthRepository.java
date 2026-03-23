package com.leadflow.repo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class MongoUserAuthRepository implements UserAuthRepository {
    private static final Logger log = LoggerFactory.getLogger(MongoUserAuthRepository.class);

    private final MongoTemplate mongoTemplate;

    public MongoUserAuthRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public boolean existsUser(String userId) {
        Query byId = new Query(Criteria.where("_id").is(userId));
        Query byUserId = new Query(Criteria.where("user_id").is(userId));

        boolean exists = mongoTemplate.exists(byId, "users") || mongoTemplate.exists(byUserId, "users");
        log.debug("User existence check for userId={} result={}", userId, exists);
        return exists;
    }
}
