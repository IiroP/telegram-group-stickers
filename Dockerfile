# Use a Node.js official image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install node-canvas dependencies
RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake \
    curl \
    unzip \
    fontconfig \
    freetype \
    ttf-freefont \
    ttf-dejavu

    # Make directories for fonts
# Create target font directories
RUN mkdir -p /usr/share/fonts/Noto_Sans

# Copy all fonts into a temp folder inside the container
COPY ./fonts /tmp/fonts

# Move fonts into correct places and refresh the font cache
RUN cp -r /tmp/fonts/Noto_Sans/* /usr/share/fonts/Noto_Sans/ && \
    rm -rf /tmp/fonts && \
    fc-cache -f -v

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package files first (for layer caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Build the TypeScript project
RUN pnpm run build

# Start the bot
CMD ["pnpm", "start"]
