# Lottie Animation Options for Futurelab

Here are several high-quality Lottie animations that would work well for your site's intro:

## Tech & Development Themed Animations

1. **Web Development Process**  
   [Preview & Download](https://lottiefiles.com/animations/web-development-process-iXvQfOZJh9)  
   *Shows the complete development process from concept to deployment*

2. **Full Stack Development**  
   [Preview & Download](https://lottiefiles.com/animations/full-stack-development-gXEvMoEuzU)  
   *Showcases front-end and back-end development concepts*

3. **App Development Cycle**  
   [Preview & Download](https://lottiefiles.com/animations/app-development-cycle-S7Tmb4QV1y)  
   *Illustrates mobile app development across platforms*

4. **Coding & Development**  
   [Preview & Download](https://lottiefiles.com/animations/coding-development-GvG4RgJ2fr)  
   *Clean, professional animation of coding interfaces*

## How to Use These Animations

1. **Download the JSON file** from LottieFiles
2. Place it in your project at `assets/animations/`
3. Update the animation path in your script.js:

```javascript
const animationPath = 'assets/animations/your-chosen-animation.json';
```

## Alternative: Use Direct URL

You can also use the hosted version from LottieFiles or Lottie Host:

```javascript
const animationPath = 'https://assets1.lottiefiles.com/packages/lf20_wxfnlf.json';
```

## Customizing the Animation

You can customize how the animation behaves:

```javascript
const animation = lottie.loadAnimation({
    container: document.getElementById('lottie-animation'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: animationPath,
});

// Control playback speed
animation.setSpeed(1.2); // Slightly faster than normal

// Play animation only when visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animation.play();
        } else {
            animation.pause();
        }
    });
}, { threshold: 0.1 });
observer.observe(document.getElementById('lottie-animation'));
```

These animations will create a powerful, modern introduction to your website while showcasing your tech expertise.
