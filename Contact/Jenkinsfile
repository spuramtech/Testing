pipeline {
    agent any

    environment {
        ENV = 'qa'
        LOGIN_USERNAME = credentials('finsta-login-username')
        LOGIN_PASSWORD = credentials('finsta-login-password')
    }

    stages {
        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Install Browsers') {
            steps {
                bat 'npx playwright install --with-deps'
            }
        }

        stage('Execute Tests') {
            steps {
                bat 'npx playwright test --grep-invert @destructive'
            }
        }

        stage('Generate Allure Report') {
            when { always() }
            steps {
                bat 'npm run allure:generate'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/html-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'allure-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
            junit allowEmptyResults: true, testResults: 'reports/junit-results.xml'
        }
    }
}
