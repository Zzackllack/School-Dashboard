# syntax=docker/dockerfile:1.7

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY Backend/pom.xml Backend/pom.xml
COPY Backend/src Backend/src

RUN mvn -f Backend/pom.xml -DskipTests clean package \
    && JAR_FILE=$(find Backend/target -maxdepth 1 -type f -name "*.jar" ! -name "original-*.jar" | head -n 1) \
    && cp "$JAR_FILE" /workspace/app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /workspace/app.jar /app/app.jar

RUN apk add --no-cache curl su-exec \
    && mkdir -p /data \
    && chown app:app /data

COPY Docker/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME /data
EXPOSE 8080

ENV SPRING_DATASOURCE_URL=jdbc:h2:file:/data/substitution-plans;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS=""

ENTRYPOINT ["/entrypoint.sh"]
CMD ["java", "-jar", "/app/app.jar"]


codex resume 0199a19a-3449-75e1-ad4c-efce932aa5b5.