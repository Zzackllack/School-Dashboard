# syntax=docker/dockerfile:1.7

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY Backend/pom.xml Backend/pom.xml
COPY Backend/src Backend/src

RUN mvn -f Backend/pom.xml -DskipTests clean package \
    && JAR_FILE=$(find Backend/target -maxdepth 1 -type f -name "*.jar" ! -name "original-*.jar" -print -quit) \
    && cp "$JAR_FILE" /workspace/app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /workspace/app.jar /app/app.jar

RUN apk add --no-cache su-exec=~0.3 \
    && apk upgrade --no-cache \
    && mkdir -p /data \
    && chown app:app /data

COPY Docker/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENV SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/school_dashboard \
    SPRING_DATASOURCE_USERNAME=school_dashboard \
    SPRING_DATASOURCE_PASSWORD=change-me \
    SPRING_FLYWAY_LOCATIONS=classpath:db/migration/postgresql \
    SPRING_PROFILES_ACTIVE=prod \
    SERVER_SERVLET_SESSION_COOKIE_SECURE=true \
    JAVA_OPTS=""

ENTRYPOINT ["/entrypoint.sh"]
CMD ["java", "-jar", "/app/app.jar"]
