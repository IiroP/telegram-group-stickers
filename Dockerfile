# Use Node.js 22 on Alpine as the base image
FROM node:22-alpine

# Install native dependencies
RUN apk add --update --no-cache build-base \
	g++ \
	cairo-dev \
	pango-dev \
	giflib-dev \
	jpeg-dev \
	librsvg-dev \
	fontconfig \
	freetype \
	ttf-freefont \
#	font-noto-emoji \
	font-roboto

ADD https://github.com/samuelngs/apple-emoji-linux/releases/latest/download/AppleColorEmoji.ttf /usr/share/fonts/AppleColorEmoji.ttf
RUN fc-cache -f -v

# Set the working directory inside the container
WORKDIR /app
COPY . .

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm build

# Start the application
CMD ["pnpm", "start"]