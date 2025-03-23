# 🏫 School Dashboard

![Status](https://img.shields.io/badge/status-under%20development-yellow)
![Version](https://img.shields.io/badge/version-0.7.6-blue)
![License](https://img.shields.io/badge/license-BSD%203--Clause-green)

> A modern, intuitive dashboard designed originally for Goethe Gymnasium Lichterfelde (GGL) to transform the lobby information display into a comprehensive school information hub.

## 📖 Overview

The School Dashboard was created to replace the outdated and clumsy substitution plan display in the lobby of Goethe Gymnasium Lichterfelde. Built with React and Spring Boot, it provides a centralized hub for students, teachers, and staff to access critical updates throughout the school day with a clean, responsive design.

While developed specifically for GGL, this application is designed to be adaptable for any school using the DSBmobile system for substitution plans.

![Dashboard Preview](https://via.placeholder.com/800x450?text=School+Dashboard+Preview)

## ✨ Features

### Current Features

- **📋 Substitution Plan Integration**
  - Real-time connection to DSBmobile API
  - Clear, organized display of class changes
  - Cached updates for performance optimization

- **🌤️ Weather Forecasts**
  - Current conditions and temperature
  - Daily forecast visualization
  - Important weather alerts

- **🚌 Transportation Schedules**
  - Real-time bus and train departures
  - Route information and delays
  - Nearest stop information

- **⏰ Live Clock**
  - Current time and date display
  - Visual time tracking

### 🔄 Planned Features

- **📱 Mobile Responsiveness**
  - Optimize display for various device sizes
  - Touch-friendly interface for tablets

- **🔔 Notification System**
  - Important announcements and alerts
  - Customizable notifications based on user preferences

- **🎨 Customizable Themes**
  - Light/dark mode toggle
  - School color integration

- **📊 School Event Calendar**
  - Upcoming events visualization
  - Important dates and deadlines

## 🛠️ Technical Implementation

### Frontend

- React 19 with TypeScript
- Tailwind CSS for styling
- Modern component architecture

### Backend

- Spring Boot 2.7 Java backend
- RESTful API design
- Caching for performance optimization

## 🧰 API Integration Challenges

The integration with DSBmobile API was a significant challenge in this project. We initially attempted implementation using various Python libraries, which resulted in:

- 8+ hours of troubleshooting authentication issues
- Inconsistent data payloads
- Undocumented API changes

After these frustrations, we discovered and implemented a 6-year-old Java library that perfectly handles the DSBmobile integration. This discovery was a breakthrough moment for our project, enabling us to finally move forward with the core functionality.

> 💡 **Lesson Learned**: Sometimes the best solution isn't the newest one. The robust Java implementation from 2018 outperformed modern alternatives because it was built with a deeper understanding of the DSBmobile system architecture.

### 😤 The DSBmobile Struggle

Working with DSBmobile has been an exercise in frustration due to heinekingmedia's approach to their platform:

- **No Public API**: Despite being used by thousands of schools, there's no official, documented API for developers
- **Outdated Technology**: The system relies on ASP.NET (.aspx files) in 2025, making modern integration unnecessarily complex
- **Zero Transparency**: Changes to the backend occur without warning, breaking third-party integrations
- **Artificial Barriers**: Simple data that should be easily accessible is obscured behind proprietary interfaces

This opacity has forced us to rely on reverse-engineered solutions, creating unnecessary technical debt and development delays for what should be a straightforward integration.

## 🚀 Getting Started

### Prerequisites

- JDK 11
- Node.js 18+ and npm
- Maven

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/school-dashboard.git
   cd school-dashboard
   ```

2. **Set up the backend**

   ```bash
   cd Backend
   # Update application.properties with your DSBmobile credentials
   mvn clean package
   java -jar target/school-dashboard-backend-1.0.0.jar
   ```

3. **Set up the frontend**

   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: <http://localhost:5173>
   - Backend API: <http://localhost:8080>

## 📝 Development Status

This project is currently under active development. The core functionality is implemented, but we're working on:

- Design refinements and UI/UX improvements
- Additional feature implementations
- Performance optimizations
- Comprehensive testing

## 💡 Why We Built This

The existing solution for displaying the substitution plan at GGL was:

- Visually outdated and difficult to read
- Limited to showing only substitution information
- Not responsive or adaptable to different screen sizes
- Unable to display other important information for students and staff

Our dashboard solves these problems by providing a modern, readable interface that combines substitution plans with weather, transportation, and other useful information in one unified display.

## 🔄 Development Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Core API Integration & Basic UI | 🔄 In Progress |
| 2 | Enhanced UI & Additional Features | 🔄 In Progress |
| 3 | Testing & Performance Optimization | 🔜 Planned |
| 4 | Deployment & Documentation | 🔜 Planned |
| 5 | User Feedback & Iteration | 🔜 Planned |
| 6 | Final Review & Launch | 🔜 Planned |

## 🤝 Contributing

Contributions are welcome! While this project was created for GGL, we've designed it to be adaptable for any school. Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [DSBmobile-API](https://github.com/Sematre/DSBmobile-API) by Sematre for the Java implementation
- All contributors who have invested their time into making this project better
  - Special thanks to [Saloking (Nikolas)](https://github.com/nikolas-bott) for giving me the idea to use the Java API instead of Python ones
- Goethe Gymnasium Lichterfelde for the opportunity to improve the school's information system

---

<p align="center">
  Made with ❤️ for improving school information systems, starting with GGL
</p>
