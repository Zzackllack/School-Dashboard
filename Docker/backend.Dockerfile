FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /workspace/app

COPY Backend/pom.xml .
COPY Backend/src src/

RUN apk add --no-cache maven
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/app/target/school-dashboard-backend-3.2.2.jar app.jar
# Install wget for healthcheck
RUN apk add --no-cache wget
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
