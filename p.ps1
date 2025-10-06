# Set project root folder
$projectRoot = "C:\Users\Omar BOURRA\Documents\Tirelire"

# Folder structure
$folders = @(
    "$projectRoot\src",
    "$projectRoot\src\config",
    "$projectRoot\src\controllers",
    "$projectRoot\src\models",
    "$projectRoot\src\routes",
    "$projectRoot\src\middleware",
    "$projectRoot\src\services",
    "$projectRoot\src\utils",
    "$projectRoot\tests",
    "$projectRoot\docker",
    "$projectRoot\docs"
)

# Create folders
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force
        Write-Host "Created folder: $folder"
    }
}

# Files to create (updated names)
$files = @(
    "$projectRoot\.env",
    "$projectRoot\.gitignore",
    "$projectRoot\package.json",
    "$projectRoot\README.md",
    "$projectRoot\src\config\dbConfig.js",              # database.js -> dbConfig.js
    "$projectRoot\src\config\appSettings.js",          # appConfig.js -> appSettings.js
    "$projectRoot\src\controllers\AuthController.js",
    "$projectRoot\src\controllers\GroupController.js",
    "$projectRoot\src\controllers\ContributionController.js", # paymentController.js -> ContributionController.js
    "$projectRoot\src\controllers\KycController.js",
    "$projectRoot\src\controllers\MessageController.js",
    "$projectRoot\src\controllers\TicketController.js",       # added TicketController
    "$projectRoot\src\models\UserModel.js",            # User.js -> UserModel.js
    "$projectRoot\src\models\GroupModel.js",
    "$projectRoot\src\models\ContributionModel.js",   # Payment.js -> ContributionModel.js
    "$projectRoot\src\models\MessageModel.js",
    "$projectRoot\src\models\TicketModel.js",
    "$projectRoot\src\middleware\AuthMiddleware.js",
    "$projectRoot\src\middleware\ErrorHandler.js",
    "$projectRoot\src\services/AuthService.js",
    "$projectRoot\src\services/GroupService.js",
    "$projectRoot\src\services/ContributionService.js",
    "$projectRoot\src\services/KycService.js",
    "$projectRoot\src/routes/authRoutes.js",
    "$projectRoot\src/routes/groupRoutes.js",
    "$projectRoot\src/routes/contributionRoutes.js",  # paymentRoutes.js -> contributionRoutes.js
    "$projectRoot\src/routes/kycRoutes.js",
    "$projectRoot\src/routes/messageRoutes.js",
    "$projectRoot\src/routes/ticketRoutes.js",        # added ticketRoutes.js
    "$projectRoot\docker\Dockerfile",
    "$projectRoot\docker\docker-compose.yml"
)

# Create files
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force
        Write-Host "Created file: $file"
    }
}

Write-Host ":white_check_mark: Project structure created successfully at $projectRoot"
