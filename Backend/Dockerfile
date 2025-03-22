FROM openjdk:11-jre-slim

WORKDIR /app

COPY target/school-dashboard-backend-1.0.0.jar app.jar

ENV DSB_USERNAME=your_username_here
ENV DSB_PASSWORD=your_password_here

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar", "--dsb.username=${DSB_USERNAME}", "--dsb.password=${DSB_PASSWORD}"]
