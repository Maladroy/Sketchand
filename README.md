# Sketchand

Sketchand is a mini app that utilizes Tensorflow's hand pose detection model to create a drawing application. Users can use hand gestures to draw, add different colors, and shapes to their sketches. This application is a fun and unique way to engage with technology and create art.

### Background

Initially, this project was an experiment using Tensorflow's hand pose detection model to create a Vietnamese sign language translator. However, the method used to detect each word and letter proved to be inefficient and not scalable. Furthermore, as Vietnam does not have a national sign language, the project was deemed impractical on a larger scale.

The idea of using hand gestures to interact with technology was still fascinating to me, so I decided to revise and repurpose the project into Sketchand, a drawing application.

### Usage

Sketchand is easy to use, and the hand gestures are intuitive. Users can draw on the screen by moving their hand in the air, and different gestures can be used to add lines to their sketches.

#### Default gesture

The thumb up gesture is the default gesture that does not do anything.

#### Drawing lines

The pinch gesture draws lines. Moving the index finger and thumb together creates a line that ends when the fingers reopen or gesture changes. A 750 ms buffer after pinching prevents errors.

### Installation

To use Sketchand, you will need to install Tensorflow and the necessary dependencies. This project can be run on a local machine or deployed to a web server.

`npm run dev` to run the app locally

### Contributing

Contributions to Sketchand are welcome. If you have any ideas for new features or improvements, feel free to submit a pull request or open an issue.

### License

MIT
