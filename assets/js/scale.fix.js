// Fix viewport scaling on mobile devices
(function(document) {
  var metas = document.getElementsByTagName('meta'),
      changeViewportContent = function(content) {
          for(var i=0; i<metas.length; i++) {
              if (metas[i].name == "viewport") {
                  metas[i].content = content;
              }
          }
      },
      initialize = function() {
          changeViewportContent("width=device-width, minimum-scale=1.0, maximum-scale=1.0");
      },
      gestureStart = function() {
          changeViewportContent("width=device-width, minimum-scale=0.25, maximum-scale=1.6");
      },
      gestureEnd = function() {
          initialize();
      };

  if (navigator.userAgent.match(/iPhone/i)) {
      initialize();
      document.addEventListener("touchstart", gestureStart, false);
      document.addEventListener("touchend", gestureEnd, false);
  }
})(document);

// Add active class to current page in navigation
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.main-nav a');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentPath.endsWith(linkPath) || 
        (linkPath !== '/' && currentPath.includes(linkPath))) {
      link.classList.add('active');
    }
  });
});

// Add copy button to code blocks
document.addEventListener('DOMContentLoaded', function() {
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach(function(codeBlock) {
    const container = codeBlock.parentNode;
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    
    copyButton.addEventListener('click', function() {
      const code = codeBlock.textContent;
      navigator.clipboard.writeText(code).then(function() {
        copyButton.textContent = 'Copied!';
        setTimeout(function() {
          copyButton.textContent = 'Copy';
        }, 2000);
      }, function() {
        copyButton.textContent = 'Failed to copy';
      });
    });
    
    container.style.position = 'relative';
    container.appendChild(copyButton);
  });
});
