(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const FLOATS_PER_PARTICLE = 9;
  const PART = {
    FACE: 0,
    HAIR: 1,
    GLASSES: 2,
    CORE: 3,
    WAIST: 3.25,
    LEFT_UPPER_ARM: 4,
    LEFT_FOREARM: 5,
    LEFT_HAND: 6,
    RIGHT_UPPER_ARM: 7,
    RIGHT_ELBOW: 7.5,
    RIGHT_FOREARM: 8,
    RIGHT_HAND: 9,
    LEFT_THIGH: 10,
    LEFT_SHIN: 11,
    LEFT_SHOE: 12,
    RIGHT_THIGH: 13,
    RIGHT_SHIN: 14,
    RIGHT_SHOE: 15,
    RIGHT_PINKY: 16,
    RIGHT_RING: 17,
    RIGHT_MIDDLE: 18,
    RIGHT_INDEX: 19,
    RIGHT_THUMB: 20,
    FIELD: 21
  };
  const RENDER_PASSES = [
    { tint: [0.12, 0.8, 1], force: 0.78, alpha: 0.18, offset: [1.35, -0.2], blend: "additive" },
    { tint: [1, 1, 1], force: 0, alpha: 1, offset: [0, 0], blend: "surface" }
  ];
  const MOBILE_RENDER_PASSES = [RENDER_PASSES[1]];

  function isNarrowPortrait(width, height) {
    return width <= 420 && height >= 600;
  }

  function isShortNarrowPortrait(width, height) {
    return width <= 420 && height >= 600 && height <= 760;
  }

  function getFigureScale(width, height) {
    if (isNarrowPortrait(width, height)) {
      if (isShortNarrowPortrait(width, height)) {
        return Math.min(height * 0.165, width * 0.4);
      }
      return Math.min(height * 0.218, width * 0.47);
    }

    if (width <= 700) {
      return Math.min(height * 0.24, width * 0.5);
    }

    // Keep the tallest hair spike below the fixed navigation on short screens.
    const navigationSafeScale = Math.max(height * 0.34, (height * 0.515 - 74) / 1.012);
    return Math.min(height * 0.42, width * 0.295, navigationSafeScale);
  }

  function getFigurePlacement(width, height) {
    const mobile = width <= 700;
    const narrowPortrait = isNarrowPortrait(width, height);
    const shortNarrowPortrait = isShortNarrowPortrait(width, height);
    return {
      offsetX: shortNarrowPortrait
        ? 0.52
        : (narrowPortrait ? 0.3 : (mobile ? 0.38 : 0.48)),
      offsetY: shortNarrowPortrait
        ? -0.64
        : (narrowPortrait ? -0.54 : (mobile ? -0.02 : -0.03)),
      approachX: mobile ? 0.10 : 0.16
    };
  }

  function createSeededRandom(seed) {
    let state = seed >>> 0;

    return function random() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mixColor(first, second, amount) {
    return first.map((channel, index) => channel + (second[index] - channel) * amount);
  }

  function buildPersonaParticles() {
    const random = createSeededRandom(12031996);
    const particles = [];
    const palette = {
      skin: [0.68, 0.45, 0.36],
      skinLight: [0.92, 0.67, 0.54],
      skinShadow: [0.42, 0.24, 0.22],
      // Neutral charcoal stays perceptually black while separating from navy.
      hair: [0.075, 0.08, 0.09],
      hairMid: [0.24, 0.25, 0.27],
      hairRim: [0.62, 0.66, 0.7],
      lens: [0.02, 0.74, 0.96],
      lensGlint: [0.39, 0.98, 1],
      frame: [0.08, 0.34, 0.42],
      shirt: [0.88, 0.88, 0.88],
      shirtLight: [1, 1, 1],
      shirtFold: [0.62, 0.62, 0.62],
      waist: [0.17, 0.27, 0.39],
      waistRim: [0.3, 0.39, 0.51],
      pants: [0.18, 0.29, 0.42],
      pantsRim: [0.33, 0.43, 0.56],
      lime: [0.57, 1, 0.05],
      limeLight: [0.78, 1, 0.28],
      sail: [0.91, 0.89, 0.79],
      sailLight: [1, 0.97, 0.87],
      shoeDark: [0.047, 0.086, 0.133],
      ice: [0.52, 0.88, 1],
      purple: [0.71, 0.48, 0.93]
    };

    function addParticle(x, y, part, color, size = 2, isSilhouette = false) {
      const seed = random();
      const shimmer = 0.84 + random() * 0.28;
      const particleSize = size * (0.9 + random() * 0.2);
      const isHeadParticle = part >= PART.FACE && part <= PART.GLASSES;
      const authoredX = isHeadParticle ? x * 0.97 : x;
      const authoredY = isHeadParticle
        ? 0.697 + (y - 0.697) * 0.96
        : y;

      particles.push(
        authoredX, authoredY, part, seed,
        isSilhouette ? -particleSize : particleSize,
        Math.min(1, color[0] * shimmer),
        Math.min(1, color[1] * shimmer),
        Math.min(1, color[2] * shimmer),
        random()
      );
    }

    function addEllipse(
      count,
      centerX,
      centerY,
      radiusX,
      radiusY,
      part,
      topColor,
      bottomColor,
      size = 2,
      stratified = false,
      sequenceOffset = 0,
      outlineContour = false
    ) {
      const contourColor = topColor.map((channel, index) => Math.max(channel, bottomColor[index]));

      for (let index = 0; index < count; index += 1) {
        const angleNoise = random();
        const radiusNoise = random();
        const sizeNoise = random();
        const sequenceIndex = index + sequenceOffset;
        const angleUnit = stratified
          ? (0.5
            + sequenceIndex * 0.7548776662466927
            + (angleNoise - 0.5) * 0.04) % 1
          : angleNoise;
        const radiusUnit = stratified
          ? (0.5
            + sequenceIndex * 0.5698402909980532
            + (radiusNoise - 0.5) * 0.04) % 1
          : radiusNoise;
        const angle = angleUnit * TAU;
        const sampledRadius = Math.sqrt(radiusUnit);
        // Prime cadences avoid aliasing with the SVG fallback's stride of six.
        const isContour = index % 11 === 0;
        const radius = isContour ? 0.92 + sampledRadius * 0.08 : sampledRadius;
        const x = centerX + Math.cos(angle) * radiusX * radius;
        const y = centerY + Math.sin(angle) * radiusY * radius;
        const colorPosition = Math.max(0, Math.min(1, (centerY + radiusY - y) / (radiusY * 2)));
        const baseColor = mixColor(topColor, bottomColor, colorPosition);
        const color = isContour ? mixColor(baseColor, contourColor, 0.18) : baseColor;
        addParticle(
          x,
          y,
          part,
          color,
          size * (0.78 + sizeNoise * 0.38)
            * (isContour ? (outlineContour ? 1.01 : 1.08) : 1),
          outlineContour && isContour
        );
      }
    }

    function addEllipseRing(count, centerX, centerY, radiusX, radiusY, part, color, size = 2.4) {
      for (let index = 0; index < count; index += 1) {
        const angle = random() * TAU;
        const jitter = (random() - 0.5) * 0.008;
        addParticle(centerX + Math.cos(angle) * (radiusX + jitter), centerY + Math.sin(angle) * (radiusY + jitter), part, color, size);
      }
    }

    function addSegment(
      count,
      start,
      end,
      width,
      part,
      startColor,
      endColor,
      size = 2,
      endpointFill = 0.5,
      contourStart = 0.76,
      stratified = false,
      sequenceOffset = 0,
      outlineContour = false,
      outlineAll = false
    ) {
      const deltaX = end[0] - start[0];
      const deltaY = end[1] - start[1];
      const length = Math.hypot(deltaX, deltaY) || 1;
      const normalX = -deltaY / length;
      const normalY = deltaX / length;
      const contourColor = startColor.map((channel, index) => Math.max(channel, endColor[index]));

      for (let index = 0; index < count; index += 1) {
        // Both modes consume the same seeded draws so later authored parts
        // retain their exact particle layout.
        const positionNoise = random();
        const offsetNoise = random();
        const sequenceIndex = index + sequenceOffset;
        const position = stratified
          ? (0.5
            + sequenceIndex * 0.7548776662466927
            + (positionNoise - 0.5) * 0.08) % 1
          : positionNoise;
        const across = stratified
          ? (0.5
            + sequenceIndex * 0.5698402909980532
            + (offsetNoise - 0.5) * 0.08) % 1
          : offsetNoise;
        const edgeTaper = endpointFill + Math.sin(position * Math.PI) * (1 - endpointFill);
        let offsetUnit = across * 2 - 1;
        const isContour = (width >= 0.04 || outlineContour)
          && Math.abs(offsetUnit) > contourStart;

        if (isContour) {
          offsetUnit = Math.sign(offsetUnit)
            * (0.9 + 0.1 * (Math.abs(offsetUnit) - contourStart) / (1 - contourStart));
        }

        const offset = offsetUnit * width * edgeTaper;
        const baseColor = mixColor(startColor, endColor, position);
        const color = isContour ? mixColor(baseColor, contourColor, 0.18) : baseColor;
        addParticle(
          start[0] + deltaX * position + normalX * offset,
          start[1] + deltaY * position + normalY * offset,
          part,
          color,
          size * (0.8 + random() * 0.36)
            * (isContour ? (outlineContour ? 1.01 : 1.08) : 1),
          outlineAll || (outlineContour && isContour)
        );
      }
    }

    function addDenimSegment(
      count,
      start,
      end,
      startWidth,
      endWidth,
      bulge,
      part,
      startColor,
      endColor,
      size = 2,
      sequenceOffset = 0
    ) {
      const deltaX = end[0] - start[0];
      const deltaY = end[1] - start[1];
      const length = Math.hypot(deltaX, deltaY) || 1;
      const normalX = -deltaY / length;
      const normalY = deltaX / length;
      const contourColor = startColor.map((channel, index) => (
        Math.max(channel, endColor[index])
      ));

      for (let index = 0; index < count; index += 1) {
        // Three authored draws plus addParticle's four preserve the exact
        // seven-draw budget used by the former ellipses and segments.
        const positionNoise = random();
        const offsetNoise = random();
        const sizeNoise = random();
        const sequenceIndex = index + sequenceOffset;
        const position = (0.5
          + sequenceIndex * 0.7548776662466927
          + (positionNoise - 0.5) * 0.08) % 1;
        const across = (0.5
          + sequenceIndex * 0.5698402909980532
          + (offsetNoise - 0.5) * 0.08) % 1;
        const localWidth = startWidth
          + (endWidth - startWidth) * position
          + Math.sin(position * Math.PI) * bulge;
        let offsetUnit = across * 2 - 1;
        const isContour = Math.abs(offsetUnit) > 0.84;

        if (isContour) {
          offsetUnit = Math.sign(offsetUnit)
            * (0.9 + 0.1 * (Math.abs(offsetUnit) - 0.84) / 0.16);
        }

        const baseColor = mixColor(startColor, endColor, position);
        const color = isContour
          ? mixColor(baseColor, contourColor, 0.16)
          : baseColor;
        addParticle(
          start[0] + deltaX * position + normalX * offsetUnit * localWidth,
          start[1] + deltaY * position + normalY * offsetUnit * localWidth,
          part,
          color,
          size * (0.86 + sizeNoise * 0.28),
          isContour
        );
      }
    }

    function addMuscleSegment(
      count,
      start,
      end,
      startWidth,
      endWidth,
      bulge,
      part,
      startColor,
      endColor,
      size = 2
    ) {
      const deltaX = end[0] - start[0];
      const deltaY = end[1] - start[1];
      const length = Math.hypot(deltaX, deltaY) || 1;
      const normalX = -deltaY / length;
      const normalY = deltaX / length;
      const contourColor = startColor.map((channel, index) => (
        Math.max(channel, endColor[index])
      ));

      for (let index = 0; index < count; index += 1) {
        const position = random();
        const localWidth = startWidth
          + (endWidth - startWidth) * position
          + Math.sin(position * Math.PI) * bulge;
        let offsetUnit = random() * 2 - 1;
        const isContour = Math.abs(offsetUnit) > 0.76;

        if (isContour) {
          offsetUnit = Math.sign(offsetUnit)
            * (0.9 + 0.1 * (Math.abs(offsetUnit) - 0.76) / 0.24);
        }

        const baseColor = mixColor(startColor, endColor, position);
        const color = isContour
          ? mixColor(baseColor, contourColor, 0.18)
          : baseColor;
        addParticle(
          start[0] + deltaX * position
            + normalX * offsetUnit * localWidth,
          start[1] + deltaY * position
            + normalY * offsetUnit * localWidth,
          part,
          color,
          size * (0.8 + random() * 0.36) * (isContour ? 1.01 : 1),
          isContour
        );
      }
    }

    function addLooseSleeve(
      count,
      start,
      end,
      startWidth,
      upperEndWidth,
      lowerEndWidth,
      upperBillow,
      lowerBillow,
      part,
      startColor,
      endColor,
      size = 2,
      sequenceOffset = 0
    ) {
      const deltaX = end[0] - start[0];
      const deltaY = end[1] - start[1];
      const length = Math.hypot(deltaX, deltaY) || 1;
      const normalX = -deltaY / length;
      const normalY = deltaX / length;
      const contourColor = startColor.map((channel, index) => (
        Math.max(channel, endColor[index])
      ));

      for (let index = 0; index < count; index += 1) {
        const positionNoise = random();
        const offsetNoise = random();
        const sizeVariation = random();
        const sequenceIndex = index + sequenceOffset;
        const position = (0.5
          + sequenceIndex * 0.7548776662466927
          + (positionNoise - 0.5) * 0.05) % 1;
        const across = (0.5
          + sequenceIndex * 0.5698402909980532
          + (offsetNoise - 0.5) * 0.05) % 1;
        let offsetUnit = across * 2 - 1;
        const curve = Math.sin(position * Math.PI);
        const easedPosition = position * position * (3 - 2 * position);
        const upperSide = offsetUnit >= 0;
        const endWidth = upperSide ? upperEndWidth : lowerEndWidth;
        const billow = upperSide ? upperBillow : lowerBillow;
        const localWidth = startWidth
          + (endWidth - startWidth) * easedPosition
          + curve * billow;
        const isContour = Math.abs(offsetUnit) > 0.76;

        if (isContour) {
          offsetUnit = Math.sign(offsetUnit)
            * (0.9 + 0.1 * (Math.abs(offsetUnit) - 0.76) / 0.24);
        }

        const offset = offsetUnit * localWidth;
        const baseColor = mixColor(startColor, endColor, position);
        const shoulderAmount = Math.max(
          0,
          Math.min(1, (position - 0.08) / 0.2)
        );
        const shoulderFade = shoulderAmount * shoulderAmount
          * (3 - 2 * shoulderAmount);
        const color = isContour
          ? mixColor(baseColor, contourColor, 0.12 * shoulderFade)
          : baseColor;
        addParticle(
          start[0] + deltaX * position + normalX * offset,
          start[1] + deltaY * position + normalY * offset,
          part,
          color,
          size * (0.8 + sizeVariation * 0.36)
            * (isContour ? 1 + 0.04 * shoulderFade : 1),
          isContour && position > 0.12
        );
      }
    }

    function addTrapezoid(
      count,
      topY,
      bottomY,
      topHalfWidth,
      bottomHalfWidth,
      part,
      topColor,
      bottomColor,
      centerX = 0,
      size = 2,
      stratified = false,
      sequenceOffset = 0
    ) {
      const contourColor = topColor.map((channel, index) => Math.max(channel, bottomColor[index]));

      for (let index = 0; index < count; index += 1) {
        const positionNoise = random();
        const acrossNoise = random();
        const sizeNoise = random();
        const sequenceIndex = index + sequenceOffset;
        const position = stratified
          ? (0.5
            + sequenceIndex * 0.7548776662466927
            + (positionNoise - 0.5) * 0.04) % 1
          : positionNoise;
        const y = topY + (bottomY - topY) * position;
        const halfWidth = topHalfWidth + (bottomHalfWidth - topHalfWidth) * position;
        let across = (stratified
          ? (0.5
            + sequenceIndex * 0.5698402909980532
            + (acrossNoise - 0.5) * 0.04) % 1
          : acrossNoise) * 2 - 1;
        const isContour = index % 13 === 0;

        if (isContour) {
          across = Math.sign(across) * (0.92 + 0.08 * Math.abs(across));
        }

        const x = centerX + across * halfWidth;
        const edgeLight = Math.abs(across);
        const baseColor = mixColor(topColor, bottomColor, position);
        addParticle(
          x,
          y,
          part,
          mixColor(baseColor, contourColor, edgeLight * 0.2),
          size * (0.8 + sizeNoise * 0.4) * (isContour ? 1.08 : 1)
        );
      }
    }

    function addCrotchedWaist(
      count,
      topY,
      bottomY,
      crotchApexY,
      topHalfWidth,
      bottomHalfWidth,
      innerJoinHalfWidth,
      part,
      topColor,
      bottomColor,
      size = 2,
      sequenceOffset = 0
    ) {
      const fullHeight = Math.max(topY - bottomY, 0.001);
      const crotchDepth = Math.max(crotchApexY - bottomY, 0.001);
      const contourColor = topColor.map((channel, colorIndex) => (
        Math.max(channel, bottomColor[colorIndex])
      ));

      for (let index = 0; index < count; index += 1) {
        // Match addTrapezoid's three authored draws so every later seeded
        // particle stays exactly where it was.
        const positionNoise = random();
        const acrossNoise = random();
        const sizeNoise = random();
        const sequenceIndex = index + sequenceOffset;
        const isInnerContour = index % 7 === 0;
        const isOuterContour = !isInnerContour && index % 13 === 0;
        let x;
        let y;
        let verticalPosition;

        if (isInnerContour) {
          const contourIndex = Math.floor(index / 7);
          const curvePosition = (0.5
            + contourIndex * 0.6180339887498949
            + (positionNoise - 0.5) * 0.05) % 1;
          // Paired sides stay balanced in the stride-six SVG fallback.
          const side = contourIndex % 4 < 2 ? -1 : 1;
          x = side * innerJoinHalfWidth
            * (2 * curvePosition - curvePosition * curvePosition);
          y = crotchApexY
            + (bottomY - crotchApexY)
              * curvePosition * curvePosition;
          verticalPosition = (topY - y) / fullHeight;
        } else {
          verticalPosition = (0.5
            + sequenceIndex * 0.7548776662466927
            + (positionNoise - 0.5) * 0.04) % 1;
          y = topY + (bottomY - topY) * verticalPosition;
          const outerHalfWidth = topHalfWidth
            + (bottomHalfWidth - topHalfWidth) * verticalPosition;
          const notchProgress = Math.max(0, Math.min(
            1,
            (crotchApexY - y) / crotchDepth
          ));
          const notchRoot = Math.sqrt(notchProgress);
          const innerHalfWidth = innerJoinHalfWidth
            * (2 * notchRoot - notchRoot * notchRoot);
          const across = (0.5
            + sequenceIndex * 0.5698402909980532
            + (acrossNoise - 0.5) * 0.04) % 1;
          let side = across < 0.5 ? -1 : 1;
          let sidePosition = across < 0.5
            ? 1 - across * 2
            : (across - 0.5) * 2;

          if (isOuterContour) {
            const contourIndex = Math.floor(index / 13);
            side = contourIndex % 4 < 2 ? -1 : 1;
            sidePosition = 1;
          }

          x = side * (
            innerHalfWidth
              + (outerHalfWidth - innerHalfWidth) * sidePosition
          );
        }

        verticalPosition = Math.max(0, Math.min(1, verticalPosition));
        const baseColor = mixColor(
          topColor,
          bottomColor,
          verticalPosition
        );
        const color = isInnerContour
          ? mixColor(baseColor, contourColor, 0.08)
          : (isOuterContour
              ? mixColor(baseColor, contourColor, 0.18)
              : baseColor);
        addParticle(
          x,
          y,
          part,
          color,
          size * (0.8 + sizeNoise * 0.4)
            * (isOuterContour ? 1.01 : 1),
          isInnerContour || isOuterContour
        );
      }
    }

    function addFittedShirt(count, part, topColor, middleColor, bottomColor, size = 2) {
      const topY = 0.61;
      const bottomY = -0.039;
      const contourColor = topColor.map((channel, index) => (
        Math.max(channel, middleColor[index], bottomColor[index])
      ));
      const smoothMix = (start, end, amount) => {
        const clamped = Math.max(0, Math.min(1, amount));
        const eased = clamped * clamped * (3 - 2 * clamped);
        return start + (end - start) * eased;
      };
      const halfWidthAt = (y) => {
        if (y >= 0.5) {
          return smoothMix(0.238, 0.108, (y - 0.5) / 0.11);
        }

        if (y >= 0.38) {
          return smoothMix(0.214, 0.238, (y - 0.38) / 0.12);
        }

        if (y >= 0.08) {
          return smoothMix(0.184, 0.214, (y - 0.08) / 0.3);
        }

        return smoothMix(0.198, 0.184, (y - bottomY) / (0.08 - bottomY));
      };
      // Sampling y uniformly over-populates narrow bands and leaves visible
      // holes through the wider chest and ribs. This compact area CDF gives
      // equal visual density across the fitted silhouette.
      const densityBandCount = 64;
      const densityCdf = [];
      let totalDensityWeight = 0;
      for (let band = 0; band < densityBandCount; band += 1) {
        const middle = (band + 0.5) / densityBandCount;
        const middleY = topY + (bottomY - topY) * middle;
        totalDensityWeight += halfWidthAt(middleY);
        densityCdf.push(totalDensityWeight);
      }
      const yFromAreaQuantile = (quantile) => {
        const target = quantile * totalDensityWeight;
        let band = 0;
        while (band < densityBandCount - 1 && densityCdf[band] < target) {
          band += 1;
        }
        const previous = band === 0 ? 0 : densityCdf[band - 1];
        const bandWeight = Math.max(densityCdf[band] - previous, 0.0001);
        const withinBand = Math.max(0, Math.min(1, (target - previous) / bandWeight));
        const verticalPosition = (band + withinBand) / densityBandCount;
        return topY + (bottomY - topY) * verticalPosition;
      };

      for (let index = 0; index < count; index += 1) {
        // Preserve the original three random draws per particle while using
        // their jitter inside a deterministic low-discrepancy field.
        const verticalNoise = random();
        const acrossNoise = random();
        const sizeNoise = random();
        const verticalQuantile = (0.5
          + index * 0.7548776662466927
          + (verticalNoise - 0.5) * 0.04) % 1;
        const acrossQuantile = (0.5
          + index * 0.5698402909980532
          + (acrossNoise - 0.5) * 0.04) % 1;
        const y = yFromAreaQuantile(verticalQuantile);
        const position = (topY - y) / (topY - bottomY);
        const halfWidth = halfWidthAt(y);
        let across = acrossQuantile * 2 - 1;
        const isContour = index % 13 === 0;

        if (isContour) {
          const contourIndex = Math.floor(index / 13);
          const side = contourIndex % 2 === 0 ? -1 : 1;
          across = side * (0.94 + 0.06 * Math.abs(across));
        }

        const baseColor = position < 0.64
          ? mixColor(topColor, middleColor, position / 0.64)
          : mixColor(middleColor, bottomColor, (position - 0.64) / 0.36);
        const edgeLight = Math.abs(across);

        addParticle(
          across * halfWidth,
          y - 0.01 * (1 - across * across)
            * Math.max(0, Math.min(1, (0.055 - y) / 0.094)),
          part,
          mixColor(baseColor, contourColor, edgeLight * 0.18),
          size * (0.86 + sizeNoise * 0.28)
            * (isContour ? 1.01 : 1),
          isContour && (y < 0.42 || y > 0.59)
        );
      }
    }

    function addTriangle(count, first, second, third, part, topColor, bottomColor, size = 2) {
      const minimumY = Math.min(first[1], second[1], third[1]);
      const maximumY = Math.max(first[1], second[1], third[1]);
      const height = Math.max(maximumY - minimumY, 0.001);
      const contourColor = topColor.map((channel, index) => Math.max(channel, bottomColor[index]));

      for (let index = 0; index < count; index += 1) {
        let firstWeight = random();
        let secondWeight = random();
        const isContour = index % 5 === 0;

        if (isContour && secondWeight < 1 / 3) {
          secondWeight = 0;
        } else if (isContour && secondWeight < 2 / 3) {
          secondWeight = firstWeight;
          firstWeight = 1 - firstWeight;
        } else if (isContour) {
          secondWeight = firstWeight;
          firstWeight = 0;
        } else if (firstWeight + secondWeight > 1) {
          firstWeight = 1 - firstWeight;
          secondWeight = 1 - secondWeight;
        }
        const x = first[0]
          + firstWeight * (second[0] - first[0])
          + secondWeight * (third[0] - first[0]);
        const y = first[1]
          + firstWeight * (second[1] - first[1])
          + secondWeight * (third[1] - first[1]);
        const verticalPosition = (maximumY - y) / height;
        const baseColor = mixColor(topColor, bottomColor, verticalPosition);
        const color = isContour ? mixColor(baseColor, contourColor, 0.22) : baseColor;
        addParticle(
          x,
          y,
          part,
          color,
          size * (isContour ? 1.01 : 1),
          isContour
        );
      }
    }

    function addRotatedEllipse(count, center, radiusX, radiusY, angle, part, topColor, bottomColor, size = 2) {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);

      for (let index = 0; index < count; index += 1) {
        const theta = random() * TAU;
        const radius = Math.sqrt(random());
        const localX = Math.cos(theta) * radiusX * radius;
        const localY = Math.sin(theta) * radiusY * radius;
        const x = center[0] + localX * cosine - localY * sine;
        const y = center[1] + localX * sine + localY * cosine;
        const colorPosition = Math.max(0, Math.min(1, (radiusY - localY) / (radiusY * 2)));
        addParticle(x, y, part, mixColor(topColor, bottomColor, colorPosition), size);
      }
    }

    function addRotatedEllipseRing(count, center, radiusX, radiusY, angle, part, color, size = 2) {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);

      for (let index = 0; index < count; index += 1) {
        const theta = random() * TAU;
        const jitter = (random() - 0.5) * 0.006;
        const localX = Math.cos(theta) * (radiusX + jitter);
        const localY = Math.sin(theta) * (radiusY + jitter);
        addParticle(
          center[0] + localX * cosine - localY * sine,
          center[1] + localX * sine + localY * cosine,
          part,
          color,
          size
        );
      }
    }

    function addQuad(
      count,
      first,
      second,
      third,
      fourth,
      part,
      topColor,
      bottomColor,
      size = 2,
      outlineSides = false
    ) {
      for (let index = 0; index < count; index += 1) {
        const acrossNoise = random();
        const down = random();
        const isSideContour = outlineSides && index % 7 === 0;
        const across = isSideContour
          ? (Math.floor(index / 7) % 2 === 0 ? 0 : 1)
          : acrossNoise;
        const topX = first[0] + (second[0] - first[0]) * across;
        const topY = first[1] + (second[1] - first[1]) * across;
        const bottomX = fourth[0] + (third[0] - fourth[0]) * across;
        const bottomY = fourth[1] + (third[1] - fourth[1]) * across;
        addParticle(
          topX + (bottomX - topX) * down,
          topY + (bottomY - topY) * down,
          part,
          mixColor(topColor, bottomColor, down),
          size,
          isSideContour
        );
      }
    }

    function addStratifiedQuad(
      count,
      first,
      second,
      third,
      fourth,
      part,
      topColor,
      bottomColor,
      size = 2,
      sequenceOffset = 0,
      outlineMode = "none"
    ) {
      for (let index = 0; index < count; index += 1) {
        // Keep the two-draw budget of addQuad while distributing sparse
        // garment and shoe panels without visible clumps.
        const acrossNoise = random();
        const downNoise = random();
        const sequenceIndex = index + sequenceOffset;
        let across = (0.5
          + sequenceIndex * 0.7548776662466927
          + (acrossNoise - 0.5) * 0.06) % 1;
        let down = (0.5
          + sequenceIndex * 0.5698402909980532
          + (downNoise - 0.5) * 0.06) % 1;
        const isEdgeContour = outlineMode !== "none" && index % 5 === 0;

        if (isEdgeContour) {
          const edge = Math.floor(index / 5);
          if (outlineMode === "toe" && edge % 3 === 2) {
            down = 1;
          } else {
            across = edge % 2 === 0 ? 0 : 1;
          }
        }
        const topX = first[0] + (second[0] - first[0]) * across;
        const topY = first[1] + (second[1] - first[1]) * across;
        const bottomX = fourth[0] + (third[0] - fourth[0]) * across;
        const bottomY = fourth[1] + (third[1] - fourth[1]) * across;
        addParticle(
          topX + (bottomX - topX) * down,
          topY + (bottomY - topY) * down,
          part,
          mixColor(topColor, bottomColor, down),
          size,
          isEdgeContour
        );
      }
    }

    function addQuadraticSegment(
      count,
      start,
      control,
      end,
      width,
      part,
      startColor,
      endColor,
      size = 2,
      stratified = false,
      outlineAll = false
    ) {
      for (let index = 0; index < count; index += 1) {
        const positionNoise = random();
        const offsetNoise = random();
        const position = stratified
          ? Math.max(0, Math.min(1,
            (index + 0.5 + (positionNoise - 0.5) * 0.35) / count
          ))
          : positionNoise;
        const inverse = 1 - position;
        const x = inverse * inverse * start[0]
          + 2 * inverse * position * control[0]
          + position * position * end[0];
        const y = inverse * inverse * start[1]
          + 2 * inverse * position * control[1]
          + position * position * end[1];
        const tangentX = 2 * inverse * (control[0] - start[0]) + 2 * position * (end[0] - control[0]);
        const tangentY = 2 * inverse * (control[1] - start[1]) + 2 * position * (end[1] - control[1]);
        const tangentLength = Math.hypot(tangentX, tangentY) || 1;
        const offset = (offsetNoise * 2 - 1) * width * (0.86 + Math.sin(position * Math.PI) * 0.14);
        addParticle(
          x - tangentY / tangentLength * offset,
          y + tangentX / tangentLength * offset,
          part,
          mixColor(startColor, endColor, position),
          size,
          outlineAll
        );
      }
    }

    function addCuffArc(
      count,
      start,
      control,
      end,
      width,
      part,
      startColor,
      endColor,
      size = 2,
      sequenceOffset = 0
    ) {
      for (let index = 0; index < count; index += 1) {
        // Three authored draws plus addParticle's four exactly match the
        // former cuff segment, preserving every later seeded particle.
        const positionNoise = random();
        const offsetNoise = random();
        const sizeNoise = random();
        const sequenceIndex = index + sequenceOffset;
        const position = (0.5
          + sequenceIndex * 0.7548776662466927
          + (positionNoise - 0.5) * 0.05) % 1;
        const inverse = 1 - position;
        const x = inverse * inverse * start[0]
          + 2 * inverse * position * control[0]
          + position * position * end[0];
        const y = inverse * inverse * start[1]
          + 2 * inverse * position * control[1]
          + position * position * end[1];
        const tangentX = 2 * inverse * (control[0] - start[0])
          + 2 * position * (end[0] - control[0]);
        const tangentY = 2 * inverse * (control[1] - start[1])
          + 2 * position * (end[1] - control[1]);
        const tangentLength = Math.hypot(tangentX, tangentY) || 1;
        const offset = (offsetNoise * 2 - 1) * width
          * (0.86 + Math.sin(position * Math.PI) * 0.14);
        addParticle(
          x - tangentY / tangentLength * offset,
          y + tangentX / tangentLength * offset,
          part,
          mixColor(startColor, endColor, position),
          size * (0.94 + sizeNoise * 0.12)
        );
      }
    }

    // A tapered jaw, shaded neck and under-chin boundary keep the portrait
    // connected while making the face readable at both render scales.
    const neckLight = mixColor(palette.skin, palette.skinShadow, 0.28);
    const neckShadow = mixColor(palette.skin, palette.skinShadow, 0.62);
    const cheekSkin = mixColor(palette.skinLight, palette.skin, 0.56);
    // A compact forehead and two straighter facial planes remove the former
    // circular cheek mass while preserving a natural glasses overhang.
    addEllipse(280, 0, 0.858, 0.106, 0.071, PART.FACE, palette.skinLight, palette.skin, 1.95, true, 0);
    addTrapezoid(96, 0.842, 0.765, 0.101, 0.086, PART.FACE, palette.skinLight, cheekSkin, 0, 1.95, true, 0);
    addTrapezoid(112, 0.765, 0.697, 0.086, 0.041, PART.FACE, cheekSkin, palette.skin, 0, 1.95, true, 96);
    addEllipse(24, -0.112, 0.807, 0.015, 0.038, PART.FACE, palette.skinLight, palette.skin, 1.75, true, 137, true);
    addEllipse(24, 0.112, 0.807, 0.015, 0.038, PART.FACE, palette.skinLight, palette.skin, 1.75, true, 271, true);
    addQuadraticSegment(
      13,
      [-0.102, 0.838],
      [-0.099, 0.797],
      [-0.086, 0.765],
      0.0034,
      PART.FACE,
      palette.skinLight,
      cheekSkin,
      1.7,
      true,
      true
    );
    addQuadraticSegment(
      19,
      [-0.086, 0.765],
      [-0.069, 0.721],
      [-0.041, 0.697],
      0.0032,
      PART.FACE,
      cheekSkin,
      palette.skin,
      1.7,
      true,
      true
    );
    addQuadraticSegment(
      13,
      [0.102, 0.838],
      [0.099, 0.797],
      [0.086, 0.765],
      0.0034,
      PART.FACE,
      palette.skinLight,
      cheekSkin,
      1.7,
      true,
      true
    );
    addQuadraticSegment(
      19,
      [0.086, 0.765],
      [0.069, 0.721],
      [0.041, 0.697],
      0.0032,
      PART.FACE,
      cheekSkin,
      palette.skin,
      1.7,
      true,
      true
    );
    addTrapezoid(
      108,
      0.701,
      0.611,
      0.038,
      0.076,
      PART.FACE,
      neckShadow,
      neckLight,
      0,
      1.86,
      true,
      160
    );
    addEllipse(44, 0, 0.612, 0.08, 0.024, PART.FACE, neckLight, neckShadow, 1.72, true, 409);
    addSegment(10, [-0.038, 0.7], [-0.076, 0.612], 0.0025, PART.FACE, palette.skinShadow, neckShadow, 1.55, 0.9, 0.76, true, 0, false, true);
    addSegment(10, [0.038, 0.7], [0.076, 0.612], 0.0025, PART.FACE, palette.skinShadow, neckShadow, 1.55, 0.9, 0.76, true, 10, false, true);
    // Draw the chin and facial marks after the neck so their planes stay crisp.
    addQuadraticSegment(
      36,
      [-0.041, 0.697],
      [0, 0.672],
      [0.041, 0.697],
      0.0029,
      PART.FACE,
      palette.skinShadow,
      palette.skinShadow,
      1.72,
      true,
      true
    );
    addQuadraticSegment(
      40,
      [0.003, 0.795],
      [-0.006, 0.777],
      [0.008, 0.755],
      0.0033,
      PART.FACE,
      palette.skin,
      palette.skinShadow,
      1.7,
      true
    );
    addQuadraticSegment(
      40,
      [-0.034, 0.724],
      [0, 0.712],
      [0.036, 0.723],
      0.0028,
      PART.FACE,
      palette.skinShadow,
      palette.skinShadow,
      1.72,
      true
    );
    // A dark compact cap carries the mass while three low tufts, a crown arc,
    // and a shallow front hairline make the short textured cut readable.
    addEllipse(145, -0.004, 0.9, 0.115, 0.06, PART.HAIR, palette.hairMid, palette.hair, 2.02, true, 0, true);
    addEllipse(30, -0.108, 0.867, 0.017, 0.046, PART.HAIR, palette.hairMid, palette.hair, 1.94, true, 145, true);
    addEllipse(24, 0.108, 0.871, 0.015, 0.041, PART.HAIR, palette.hairMid, palette.hair, 1.94, true, 175, true);
    [
      [34, [-0.108, 0.889], [-0.02, 0.925], [-0.064, 0.975]],
      [36, [-0.075, 0.915], [0.05, 0.928], [-0.01, 0.982]],
      [30, [-0.02, 0.916], [0.113, 0.884], [0.073, 0.975]]
    ].forEach(([count, first, second, third]) => {
      addTriangle(count, first, second, third, PART.HAIR, palette.hairRim, palette.hairMid, 2);
    });
    addQuadraticSegment(
      30,
      [-0.108, 0.915],
      [-0.005, 1.015],
      [0.108, 0.922],
      0.0034,
      PART.HAIR,
      palette.hairMid,
      palette.hairMid,
      2.28,
      true,
      true
    );
    addQuadraticSegment(
      28,
      [-0.103, 0.87],
      [-0.01, 0.858],
      [0.102, 0.869],
      0.003,
      PART.HAIR,
      palette.hairMid,
      palette.hairMid,
      2.12,
      true,
      true
    );

    // Mirrored cyan sunglasses remain visible through the whole sequence.
    addEllipse(85, -0.058, 0.815, 0.052, 0.032, PART.GLASSES, palette.lensGlint, palette.lens, 2.2);
    addEllipse(85, 0.058, 0.815, 0.052, 0.032, PART.GLASSES, palette.lensGlint, palette.lens, 2.2);
    addEllipseRing(48, -0.058, 0.815, 0.055, 0.034, PART.GLASSES, palette.frame, 2.4);
    addEllipseRing(48, 0.058, 0.815, 0.055, 0.034, PART.GLASSES, palette.frame, 2.4);
    addSegment(24, [-0.008, 0.818], [0.008, 0.818], 0.005, PART.GLASSES, palette.frame, palette.frame, 2.35);
    addSegment(14, [-0.108, 0.822], [-0.132, 0.835], 0.004, PART.GLASSES, palette.frame, palette.frame, 2);
    addSegment(14, [0.108, 0.822], [0.132, 0.835], 0.004, PART.GLASSES, palette.frame, palette.frame, 2);
    addSegment(18, [-0.09, 0.835], [-0.045, 0.832], 0.0035, PART.GLASSES, palette.lensGlint, palette.lensGlint, 2.25);

    // One continuous fitted shape avoids a rectangular torso: the neckline
    // slopes into the shoulders, the ribs taper toward the waist, and the hem
    // opens slightly where it meets the jeans.
    const shirtHem = mixColor(palette.shirt, palette.shirtFold, 0.35);
    addFittedShirt(2650, PART.CORE, palette.shirtLight, palette.shirt, shirtHem, 2.14);
    addEllipseRing(60, 0, 0.61, 0.108, 0.036, PART.CORE, palette.shirtFold, 1.85);
    addQuadraticSegment(50, [-0.185, 0.45], [-0.16, 0.22], [-0.09, 0.02], 0.007, PART.CORE, palette.shirt, palette.shirtFold, 1.68);
    addQuadraticSegment(26, [0.185, 0.45], [0.16, 0.22], [0.09, 0.02], 0.007, PART.CORE, palette.shirt, palette.shirtFold, 1.68, true);
    const underarmShade = mixColor(palette.shirt, palette.shirtFold, 0.45);
    addStratifiedQuad(
      64,
      [0.145, 0.58], [0.232, 0.548],
      [0.238, 0.447], [0.19, 0.42],
      PART.CORE,
      palette.shirt, underarmShade,
      1.82,
      173
    );
    addQuadraticSegment(60, [-0.198, -0.039], [0, -0.059], [0.198, -0.039], 0.0025, PART.CORE, shirtHem, shirtHem, 1.55, true);
    // Give the compact waistband fewer, smaller particles and move its former
    // density into the continuous thigh fields. The early thigh samples keep
    // every later authored body part on the same deterministic random stream.
    const legX = 0.115;
    const denimMid = mixColor(palette.pants, palette.pantsRim, 0.28);
    const denimJoint = mixColor(palette.pants, palette.pantsRim, 0.1);
    const crotchDenim = mixColor(palette.waist, denimJoint, 0.7);
    addCrotchedWaist(
      420,
      -0.041,
      -0.16,
      -0.118,
      0.184,
      0.196,
      0.029,
      PART.WAIST,
      denimMid,
      crotchDenim,
      1.95
    );
    addSegment(
      50,
      [-0.18, -0.043],
      [0.18, -0.043],
      0.003,
      PART.WAIST,
      palette.waist,
      palette.waist,
      1.62,
      0.94,
      0.86,
      true
    );
    addDenimSegment(
      160,
      [-legX, -0.045],
      [-legX, -0.43],
      0.086,
      0.074,
      0.007,
      PART.LEFT_THIGH,
      denimMid,
      denimJoint,
      2.25,
      0
    );
    addDenimSegment(
      160,
      [legX, -0.045],
      [legX, -0.43],
      0.086,
      0.074,
      0.007,
      PART.RIGHT_THIGH,
      denimMid,
      denimJoint,
      2.25,
      0
    );

    // A real sleeve edge separates the garment from the exposed upper arm.
    // The original full-arm colour gradient made the left sleeve look longer
    // than the right and obscured where the shoulder ended.
    addLooseSleeve(260, [-0.238, 0.5], [-0.29, 0.338], 0.058, 0.061, 0.062, 0.006, 0.008, PART.LEFT_UPPER_ARM, palette.shirt, shirtHem, 2.04);
    addMuscleSegment(180, [-0.29, 0.338], [-0.34, 0.18], 0.048, 0.045, 0.006, PART.LEFT_UPPER_ARM, palette.skinLight, palette.skin, 2.02);
    addSegment(360, [-0.34, 0.18], [-0.32, -0.14], 0.052, PART.LEFT_FOREARM, palette.skinLight, palette.skin, 2.02, 0.74, 0.76, true, 0, true);
    addEllipse(104, -0.316, -0.195, 0.046, 0.06, PART.LEFT_HAND, palette.skinLight, palette.skin, 2.08, false, 0, true);
    addEllipse(34, -0.338, -0.202, 0.018, 0.044, PART.LEFT_HAND, palette.skin, palette.skinShadow, 1.92);
    addEllipse(24, -0.313, -0.241, 0.041, 0.017, PART.LEFT_HAND, palette.skinLight, palette.skin, 1.96);
    [
      [[-0.344, -0.236], [-0.35, -0.258], [-0.349, -0.276]],
      [[-0.328, -0.245], [-0.336, -0.271], [-0.333, -0.291]],
      [[-0.311, -0.248], [-0.32, -0.275], [-0.314, -0.296]],
      [[-0.294, -0.241], [-0.3, -0.265], [-0.292, -0.286]],
      [[-0.275, -0.187], [-0.26, -0.215], [-0.266, -0.237]]
    ].forEach(([start, control, end], index) => {
      addQuadraticSegment(
        18,
        start,
        control,
        end,
        index === 4 ? 0.011 : 0.01,
        PART.LEFT_HAND,
        palette.skinLight,
        palette.skin,
        1.9,
        false,
        true
      );
    });

    // A flared, softly sagging sleeve keeps the raised side loose while the
    // fitted torso supplies a stable armhole. Its cuff moves with the arm.
    addLooseSleeve(
      260,
      [0.238, 0.5], [0.405, 0.511],
      0.058, 0.057, 0.064, 0.006, 0.02,
      PART.RIGHT_UPPER_ARM,
      palette.shirt, shirtHem,
      2.04,
      97
    );
    const cuffShadeStart = mixColor(palette.shirtFold, palette.shirt, 0.15);
    const cuffShadeEnd = mixColor(palette.shirtFold, palette.shirt, 0.38);
    addCuffArc(
      24,
      [0.402, 0.432], [0.417, 0.51], [0.41, 0.58],
      0.0031,
      PART.RIGHT_UPPER_ARM,
      cuffShadeStart, cuffShadeEnd,
      1.6,
      37
    );
    addMuscleSegment(
      180,
      [0.409, 0.511], [0.576, 0.501],
      0.052, 0.055, 0.018,
      PART.RIGHT_UPPER_ARM,
      palette.skinLight, palette.skin,
      2.04
    );
    addEllipse(
      40,
      0.576, 0.501,
      0.055, 0.052,
      PART.RIGHT_ELBOW,
      palette.skinLight, palette.skin,
      2.08
    );
    addMuscleSegment(
      340,
      [0.576, 0.501], [0.483, 0.811],
      0.055, 0.04, 0.01,
      PART.RIGHT_FOREARM,
      palette.skinLight, palette.skin,
      2.04
    );
    // One tapered palm plane avoids the extra-finger silhouette created by
    // stacked vertical ellipses. Four upright digits and a low, lateral thumb
    // make the hand readable from the final front-facing wave.
    addQuad(
      124,
      [0.441, 0.897], [0.53, 0.897],
      [0.525, 0.798], [0.45, 0.798],
      PART.RIGHT_HAND,
      palette.skinLight, palette.skin,
      2.08,
      true
    );
    addRotatedEllipse(30, [0.469, 0.844], 0.027, 0.028, 0.24, PART.RIGHT_HAND, palette.skinLight, palette.skin, 1.94);
    addRotatedEllipse(18, [0.505, 0.857], 0.019, 0.022, 0.12, PART.RIGHT_HAND, palette.skin, palette.skinShadow, 1.92);
    const wavingDigits = [
      [PART.RIGHT_INDEX, 20, [0.453, 0.893], [0.43, 0.955], 0.0102],
      [PART.RIGHT_MIDDLE, 22, [0.476, 0.897], [0.469, 0.97], 0.0105],
      [PART.RIGHT_RING, 20, [0.5, 0.897], [0.502, 0.964], 0.0102],
      [PART.RIGHT_PINKY, 18, [0.523, 0.894], [0.534, 0.948], 0.0097],
      [PART.RIGHT_THUMB, 18, [0.452, 0.859], [0.407, 0.872], 0.0135]
    ];
    wavingDigits.forEach(([part, count, start, end, width]) => {
      addSegment(
        count,
        start,
        end,
        width,
        part,
        palette.skinLight,
        palette.skin,
        part === PART.RIGHT_THUMB ? 2.06 : 1.95,
        0.84,
        0.76,
        false,
        0,
        true
      );
    });

    // The articulated walk maps these evenly sampled thigh and shin fields to
    // shared hip, knee and ankle joints; the standing pose remains parallel.
    addDenimSegment(45, [-legX, -0.045], [-legX, -0.43], 0.086, 0.074, 0.007, PART.LEFT_THIGH, denimMid, denimJoint, 2.25, 160);
    addDenimSegment(850, [-legX, -0.045], [-legX, -0.43], 0.086, 0.074, 0.007, PART.LEFT_THIGH, denimMid, denimJoint, 2.25, 205);
    addDenimSegment(50, [-legX, -0.43], [-legX, -0.84], 0.074, 0.062, 0.009, PART.LEFT_SHIN, denimJoint, palette.pants, 2.25, 0);
    addDenimSegment(790, [-legX, -0.43], [-legX, -0.84], 0.074, 0.062, 0.009, PART.LEFT_SHIN, denimJoint, palette.pants, 2.25, 50);
    addDenimSegment(45, [legX, -0.045], [legX, -0.43], 0.086, 0.074, 0.007, PART.RIGHT_THIGH, denimMid, denimJoint, 2.25, 160);
    addDenimSegment(850, [legX, -0.045], [legX, -0.43], 0.086, 0.074, 0.007, PART.RIGHT_THIGH, denimMid, denimJoint, 2.25, 205);
    addDenimSegment(50, [legX, -0.43], [legX, -0.84], 0.074, 0.062, 0.009, PART.RIGHT_SHIN, denimJoint, palette.pants, 2.25, 0);
    addDenimSegment(790, [legX, -0.43], [legX, -0.84], 0.074, 0.062, 0.009, PART.RIGHT_SHIN, denimJoint, palette.pants, 2.25, 50);

    // The viewer-left shoe is the canonical near-front camera view; the
    // opposite shoe mirrors it. Centered panels and horizontal soles avoid
    // the false 30-degree yaw created by stacked oval top planes.
    function addVisionaireShoe(side, part) {
      const centerX = side * legX;
      const mirror = side < 0 ? 1 : -1;
      // Keep the sole planted while reducing the former boot-like height and
      // width. Every panel stays front-facing and shares the same scale.
      const point = (x, y) => [
        centerX + x * mirror * 0.88,
        -0.969 + (y + 0.969) * 0.84
      ];
      addStratifiedQuad(
        54,
        point(-0.061, -0.884), point(0.061, -0.884),
        point(0.084, -0.944), point(-0.084, -0.944),
        part,
        palette.limeLight, palette.lime,
        2.12,
        0,
        "toe"
      );
      addStratifiedQuad(
        42,
        point(-0.05, -0.75), point(0.05, -0.75),
        point(0.07, -0.92), point(-0.07, -0.92),
        part,
        palette.limeLight, palette.lime,
        2.12,
        54,
        "sides"
      );
      addStratifiedQuad(
        30,
        point(-0.036, -0.754), point(0.036, -0.754),
        point(0.05, -0.906), point(-0.05, -0.906),
        part,
        palette.sailLight, palette.sail,
        2.04,
        96
      );
      addStratifiedQuad(
        40,
        point(-0.044, -0.835), point(0.044, -0.835),
        point(0.064, -0.915), point(-0.064, -0.915),
        part,
        palette.sailLight, palette.sail,
        2.02,
        126
      );
      addQuadraticSegment(
        24,
        point(-0.079, -0.925), point(0, -0.947), point(0.079, -0.925),
        0.004,
        part,
        palette.limeLight, palette.limeLight,
        2.05,
        false,
        true
      );
      addSegment(22, point(-0.052, -0.779), point(0.052, -0.779), 0.014, part, palette.shoeDark, palette.shoeDark, 2.08, 0.86);
      addSegment(12, point(-0.046, -0.785), point(-0.059, -0.899), 0.007, part, palette.shoeDark, palette.shoeDark, 1.96, 0.82);
      addSegment(12, point(0.046, -0.785), point(0.059, -0.899), 0.007, part, palette.shoeDark, palette.shoeDark, 1.96, 0.82);
      addSegment(8, point(0, -0.779), point(0, -0.899), 0.013, part, palette.shoeDark, palette.shoeDark, 1.96, 0.84);
      [
        [0.041, -0.806],
        [0.046, -0.832],
        [0.051, -0.858],
        [0.056, -0.884]
      ].forEach(([halfWidth, y]) => {
        addSegment(5, point(-halfWidth, y), point(halfWidth, y), 0.0045, part, palette.shoeDark, palette.shoeDark, 1.82, 0.92);
      });
      addSegment(24, point(-0.088, -0.951), point(0.088, -0.951), 0.012, part, palette.sailLight, palette.sail, 2.25, 0.92, 0.76, false, 0, false, true);
      addSegment(16, point(-0.083, -0.969), point(0.083, -0.969), 0.009, part, palette.shoeDark, palette.shoeDark, 2.3, 0.94, 0.76, false, 0, false, true);
    }

    addVisionaireShoe(-1, PART.LEFT_SHOE);
    addVisionaireShoe(1, PART.RIGHT_SHOE);

    // These particles are stored in clip space and therefore cover any viewport.
    for (let index = 0; index < 520; index += 1) {
      const x = random() * 2.16 - 1.08;
      const y = random() * 2.12 - 1.06;
      const colorChoice = random();
      const color = colorChoice < 0.62 ? palette.ice : colorChoice < 0.84 ? palette.lensGlint : palette.purple;
      const brightness = 0.34 + random() * 0.38;
      addParticle(x, y, PART.FIELD, color.map((channel) => channel * brightness), 0.7 + random() * 1.25);
    }

    return new Float32Array(particles);
  }

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Persona shader could not compile: ${message}`);
    }
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Persona shader could not link: ${message}`);
    }
    return program;
  }

  const VERTEX_SHADER = `
    precision highp float;

    attribute vec2 a_position;
    attribute float a_part;
    attribute float a_seed;
    attribute float a_size;
    attribute vec3 a_color;
    attribute float a_twinkle;

    uniform float u_time;
    uniform float u_scroll;
    uniform float u_sequence;
    uniform float u_dpr;
    uniform float u_motion;
    uniform float u_approach_x;
    uniform vec2 u_scale;
    uniform vec2 u_figure_offset;
    uniform vec2 u_channel_offset;
    uniform vec3 u_tint;
    uniform float u_force_tint;
    uniform float u_alpha;

    varying vec3 v_color;
    varying float v_alpha;
    varying float v_silhouette;

    const float PI = 3.14159265;
    const float TAU = 6.28318530;
    const float LEG_X = 0.115;
    const float WAIST_PART = 3.25;
    const float ARM_CAMERA_DISTANCE = 2.8;

    vec2 rotateAround(vec2 point, vec2 pivot, float angle) {
      float sine = sin(angle);
      float cosine = cos(angle);
      vec2 local = point - pivot;
      return pivot + vec2(local.x * cosine - local.y * sine, local.x * sine + local.y * cosine);
    }

    vec2 remapBone(
      vec2 point,
      vec2 sourceStart,
      vec2 sourceEnd,
      vec2 targetStart,
      vec2 targetEnd
    ) {
      vec2 source = sourceEnd - sourceStart;
      vec2 sourceAxis = normalize(source);
      vec2 sourceNormal = vec2(-sourceAxis.y, sourceAxis.x);
      vec2 target = targetEnd - targetStart;
      vec2 targetAxis = normalize(target);
      vec2 targetNormal = vec2(-targetAxis.y, targetAxis.x);
      float along = dot(point - sourceStart, sourceAxis) / max(length(source), 0.0001);
      float across = dot(point - sourceStart, sourceNormal);
      return mix(targetStart, targetEnd, along) + targetNormal * across;
    }

    float armPerspective(float depth) {
      return ARM_CAMERA_DISTANCE
        / max(ARM_CAMERA_DISTANCE - depth, 0.8);
    }

    vec2 projectArmJoint(vec3 joint, vec2 shoulder) {
      float perspective = armPerspective(joint.z);
      return shoulder + (joint.xy - shoulder) * perspective;
    }

    vec2 remapBonePerspective(
      vec2 point,
      vec2 sourceStart,
      vec2 sourceEnd,
      vec2 targetStart,
      vec2 targetEnd,
      float startPerspective,
      float endPerspective
    ) {
      vec2 source = sourceEnd - sourceStart;
      vec2 sourceAxis = normalize(source);
      vec2 sourceNormal = vec2(-sourceAxis.y, sourceAxis.x);
      vec2 target = targetEnd - targetStart;
      vec2 targetAxis = normalize(target);
      vec2 targetNormal = vec2(-targetAxis.y, targetAxis.x);
      float along = dot(point - sourceStart, sourceAxis)
        / max(length(source), 0.0001);
      float across = dot(point - sourceStart, sourceNormal);
      float widthPerspective = mix(
        startPerspective,
        endPerspective,
        clamp(along, 0.0, 1.0)
      );
      return mix(targetStart, targetEnd, along)
        + targetNormal * across * widthPerspective;
    }

    vec2 remapFinger(
      vec2 point,
      vec2 sourceStart,
      vec2 sourceEnd,
      vec2 targetStart,
      vec2 targetControl,
      vec2 targetEnd
    ) {
      vec2 source = sourceEnd - sourceStart;
      float sourceLengthSquared = max(dot(source, source), 0.0001);
      float along = clamp(dot(point - sourceStart, source) / sourceLengthSquared, 0.0, 1.0);
      vec2 sourceAxis = normalize(source);
      float across = dot(point - sourceStart, vec2(-sourceAxis.y, sourceAxis.x));
      float inverse = 1.0 - along;
      vec2 curve = inverse * inverse * targetStart
        + 2.0 * inverse * along * targetControl
        + along * along * targetEnd;
      vec2 tangent = 2.0 * inverse * (targetControl - targetStart)
        + 2.0 * along * (targetEnd - targetControl);
      vec2 targetAxis = normalize(tangent + vec2(0.0001));
      return curve + vec2(-targetAxis.y, targetAxis.x) * across;
    }

    float hash11(float value) {
      value = fract(value * 0.1031);
      value *= value + 33.33;
      value *= value + value;
      return fract(value);
    }

    vec2 hash21(float value) {
      return vec2(hash11(value * 17.17 + 1.7), hash11(value * 29.31 + 7.3));
    }

    float smoother01(float value) {
      float x = clamp(value, 0.0, 1.0);
      return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    }

    float phaseRamp(float phase, float start, float end) {
      return smoother01((phase - start) / max(end - start, 0.0001));
    }

    float phasePulse(float phase, float riseStart, float riseEnd, float fallStart, float fallEnd) {
      return phaseRamp(phase, riseStart, riseEnd)
        * (1.0 - phaseRamp(phase, fallStart, fallEnd));
    }

    float gaitStance(float phase) {
      return max(
        1.0 - phaseRamp(phase, 0.52, 0.64),
        phaseRamp(phase, 0.88, 0.995)
      );
    }

    float gaitCurve(
      float phase,
      float initialContact,
      float loading,
      float midstance,
      float terminalStance,
      float toeOff,
      float initialSwing,
      float midSwing,
      float nextContact
    ) {
      float p = fract(phase);
      if (p < 0.1) {
        return mix(initialContact, loading, smoother01(p / 0.1));
      }
      if (p < 0.3) {
        return mix(loading, midstance, smoother01((p - 0.1) / 0.2));
      }
      if (p < 0.5) {
        return mix(midstance, terminalStance, smoother01((p - 0.3) / 0.2));
      }
      if (p < 0.6) {
        return mix(terminalStance, toeOff, smoother01((p - 0.5) / 0.1));
      }
      if (p < 0.7) {
        return mix(toeOff, initialSwing, smoother01((p - 0.6) / 0.1));
      }
      if (p < 0.85) {
        return mix(initialSwing, midSwing, smoother01((p - 0.7) / 0.15));
      }
      return mix(midSwing, nextContact, smoother01((p - 0.85) / 0.15));
    }

    float gaitKnee(float phase) {
      return gaitCurve(phase, 6.0, 18.0, 3.0, 8.0, 38.0, 58.0, 26.0, 6.0);
    }

    float gaitClearance(float phase) {
      return gaitCurve(phase, 0.0, 0.0, 0.0, 0.006, 0.052, 0.088, 0.025, 0.0);
    }

    float gaitFootPitch(float phase) {
      return gaitCurve(phase, 13.0, 5.0, 0.0, -5.0, -19.0, -9.0, 5.0, 13.0);
    }

    float gaitHeelLift(float phase) {
      return 0.018 * phasePulse(phase, 0.34, 0.48, 0.54, 0.64);
    }

    float denimHalfWidthAt(float sourceY) {
      if (sourceY >= -0.43) {
        float thighProgress = clamp((-0.045 - sourceY) / 0.385, 0.0, 1.0);
        return mix(0.086, 0.074, thighProgress)
          + sin(thighProgress * PI) * 0.007;
      }
      float shinProgress = clamp((-0.43 - sourceY) / 0.41, 0.0, 1.0);
      return mix(0.074, 0.062, shinProgress)
        + sin(shinProgress * PI) * 0.009;
    }

    float legPerspective(float depth) {
      return clamp(3.25 / max(3.25 - depth, 1.0), 0.89, 1.13);
    }

    vec2 projectLegJoint(vec3 joint) {
      float perspective = legPerspective(joint.z);
      return vec2(
        (joint.x + 0.025 * joint.z) * perspective,
        0.02 + (joint.y - 0.02) * perspective
      );
    }

    float boneAlong(vec2 point, vec2 start, vec2 end) {
      vec2 axis = end - start;
      return clamp(
        dot(point - start, axis) / max(dot(axis, axis), 0.0001),
        0.0,
        1.0
      );
    }

    void deformShoe(
      vec2 sourcePoint,
      vec2 sourceAnkle,
      vec2 ankleTarget,
      float ankleProjection,
      float phase,
      float amount,
      out vec2 shoePoint,
      out float pitchProjection
    ) {
      float pitch = gaitFootPitch(phase) * PI / 180.0 * amount;
      float pitchCos = cos(pitch);
      float pitchSin = sin(pitch);
      vec2 local = (sourcePoint - sourceAnkle) * ankleProjection;

      // Sagittal pitch reads as depth/height change while retaining the
      // straight-on shoe camera angle requested for the standing pose.
      float pitchDepth = local.y * pitchSin;
      pitchProjection = clamp(1.0 + 0.82 * pitchDepth, 0.94, 1.06);
      shoePoint = ankleTarget + vec2(
        local.x * pitchProjection,
        local.y * pitchCos
      );

      // The authored outsole remains planted throughout the stance phase.
      float soleLocal = (-0.969 - sourceAnkle.y) * ankleProjection;
      shoePoint.y += soleLocal
        * (1.0 - pitchCos)
        * gaitStance(phase);

      // Keep the front of the outsole planted while the ankle and upper shoe
      // rise into push-off. The front-facing camera keeps its requested angle,
      // but the changing shoe height now reads as a heel-to-toe rocker.
      float toeAnchor = 1.0 - smoother01(clamp(
        (sourcePoint.y + 0.955) / 0.085,
        0.0,
        1.0
      ));
      float plantedLift = gaitHeelLift(phase)
        + gaitClearance(phase) * gaitStance(phase);
      shoePoint.y -= plantedLift * toeAnchor * amount;

      float heelStrike = max(
        1.0 - phaseRamp(phase, 0.0, 0.13),
        phaseRamp(phase, 0.9, 1.0)
      );
      float toeBody = smoother01(clamp(
        (-sourcePoint.y - 0.84) / 0.09,
        0.0,
        1.0
      )) * (
        1.0 - smoother01(clamp(
          (-sourcePoint.y - 0.935) / 0.03,
          0.0,
          1.0
        ))
      );
      shoePoint.y += 0.014 * heelStrike * toeBody * amount;
    }

    const float CONTACT_CYCLES = 2.6041667;
    const float CONTACT_STOP = 0.96;
    const float CONTACT_FLOOR = -0.969;
    const float CONTACT_CAMERA = 3.25;
    const float CONTACT_THIGH = 0.45;
    const float CONTACT_SHIN = 0.41;

    float personaApproach(float entry) {
      float p = clamp(entry / CONTACT_STOP, 0.0, 1.0);
      return p * p * (3.0 - 2.0 * p);
    }

    float personaApproachScale(float entry) {
      return mix(0.62, 1.0, personaApproach(entry));
    }

    float personaApproachTravelX() {
      // Bound lateral travel on wide, short screens so planted contacts remain
      // within reach of the fixed-length leg rig and the knees stay separated.
      return min(u_approach_x / max(u_scale.x, 0.0001), 0.32);
    }

    vec2 personaStagePoint(vec2 point, float entry) {
      float approach = personaApproach(entry);
      float scale = personaApproachScale(entry);
      return vec2(
        point.x * scale + (1.0 - approach) * personaApproachTravelX(),
        CONTACT_FLOOR + (point.y - CONTACT_FLOOR) * scale
          + (1.0 - approach) * 0.20
      );
    }

    vec2 personaLocalPoint(vec2 stagePoint, float entry) {
      float approach = personaApproach(entry);
      float scale = personaApproachScale(entry);
      return vec2(
        (stagePoint.x - (1.0 - approach) * personaApproachTravelX()) / scale,
        CONTACT_FLOOR + (
          stagePoint.y - CONTACT_FLOOR - (1.0 - approach) * 0.20
        ) / scale
      );
    }

    vec2 plantedContact(float side, float stepIndex, float phaseOffset) {
      float finalStep = floor(CONTACT_STOP * CONTACT_CYCLES + phaseOffset + 0.00001);
      float contactEntry = stepIndex >= finalStep
        ? CONTACT_STOP
        : clamp((stepIndex + 0.3 - phaseOffset) / CONTACT_CYCLES, 0.0, CONTACT_STOP);
      return personaStagePoint(vec2(side * LEG_X, CONTACT_FLOOR), contactEntry);
    }

    void solveLeg(
      float side,
      float phase,
      float amount,
      vec2 pelvisTravel,
      out vec2 hipTarget,
      out vec2 kneeTarget,
      out vec2 ankleTarget,
      out float hipPerspective,
      out float kneePerspective,
      out float anklePerspective
    ) {
      float entry = clamp(u_sequence, 0.0, CONTACT_STOP);
      float phaseOffset = side < 0.0 ? 0.0 : 0.5;
      float cycles = entry * CONTACT_CYCLES + phaseOffset;
      float stepIndex = floor(cycles);
      float contactPhase = fract(cycles);
      float swing = clamp((contactPhase - 0.6) / 0.4, 0.0, 1.0);
      vec2 contact = plantedContact(side, stepIndex, phaseOffset);
      vec2 nextContact = plantedContact(side, stepIndex + 1.0, phaseOffset);
      vec2 soleStage = mix(contact, nextContact, smoother01(swing));
      // A smooth zero-velocity lift. All stance samples preserve the exact same
      // stage coordinate; the swing endpoint is exactly the next planted contact.
      float liftArc = sin(PI * swing);
      soleStage.y += 0.075 * liftArc * liftArc * amount;
      vec2 soleLocal = personaLocalPoint(soleStage, entry);

      vec3 hip = vec3(
        side * LEG_X + pelvisTravel.x * amount,
        0.02 + pelvisTravel.y * amount,
        0.024 * cos(TAU * contactPhase) * amount
      );

      // Match the existing deformShoe's outsole equations exactly. Do not add a
      // second ankle-height override after this solve. The positive offset from
      // sole to ankle includes the existing heel rocker while its toe stays put.
      float pitch = gaitFootPitch(phase) * PI / 180.0 * amount;
      float stance = gaitStance(phase);
      float pitchFactor = cos(pitch) + (1.0 - cos(pitch)) * stance;
      float plantedLift = (
        gaitHeelLift(phase) + gaitClearance(phase) * stance
      ) * amount;

      // Inverse projection of the desired ankle pixel defines a 3D ray parameterized
      // by ankle depth. Its intersection with the hip's reachable sphere preserves
      // the contact pixel while supplying sagittal motion instead of inward folding.
      vec3 rayBase = vec3(
        soleLocal.x,
        soleLocal.y + plantedLift + 0.129 * pitchFactor,
        0.0
      );
      vec3 ray = vec3(
        -soleLocal.x / CONTACT_CAMERA - 0.025,
        -(soleLocal.y - 0.02 + plantedLift) / CONTACT_CAMERA,
        1.0
      );
      vec3 relative = rayBase - hip;
      float aa = dot(ray, ray);
      float bb = 2.0 * dot(relative, ray);
      float minimumDistanceSquared = max(
        0.0,
        dot(relative, relative) - bb * bb / (4.0 * aa)
      );
      float kneeAngle = gaitKnee(phase) * PI / 180.0 * amount;
      float desiredDistanceSquared = CONTACT_THIGH * CONTACT_THIGH
        + CONTACT_SHIN * CONTACT_SHIN
        + 2.0 * CONTACT_THIGH * CONTACT_SHIN * cos(kneeAngle);
      // At steep viewing angles, reduce nominal flexion only as much as necessary
      // to keep the same foot contact reachable. The bounded approach keeps this
      // distance <= .86 throughout the animation.
      float distanceSquared = max(
        desiredDistanceSquared,
        minimumDistanceSquared + 0.00000001
      );
      float discriminant = max(
        0.0,
        bb * bb - 4.0 * aa * (dot(relative, relative) - distanceSquared)
      );
      float ankleDepth = (-bb - sqrt(discriminant)) / (2.0 * aa);
      vec3 ankle = rayBase + ray * ankleDepth;

      vec3 hipToAnkle = ankle - hip;
      float distance = max(length(hipToAnkle), 0.00001);
      vec3 axis = hipToAnkle / distance;
      float along = (
        CONTACT_THIGH * CONTACT_THIGH - CONTACT_SHIN * CONTACT_SHIN
          + distance * distance
      ) / (2.0 * distance);
      float bendHeight = sqrt(max(
        0.0,
        CONTACT_THIGH * CONTACT_THIGH - along * along
      ));
      // Positive depth faces the camera. A sagittal pole produces forward knee
      // flexion without explicitly steering the knee toward the body's center.
      vec3 pole = normalize(vec3(0.0, 0.0, 1.0) - axis * axis.z);
      vec3 knee = hip + axis * along + pole * bendHeight;

      hipTarget = projectLegJoint(hip);
      kneeTarget = projectLegJoint(knee);
      ankleTarget = projectLegJoint(ankle);
      hipPerspective = legPerspective(hip.z);
      kneePerspective = legPerspective(knee.z);
      anklePerspective = legPerspective(ankle.z);
    }

    void main() {
      vec2 point = a_position;
      bool isField = a_part > 20.5;
      float silhouette = 1.0 - step(0.0, a_size);
      float particleSize = abs(a_size);
      v_silhouette = silhouette;
      float entry = clamp(u_sequence, 0.0, 1.0);
      float approach = personaApproach(entry);
      float walkFade = smoothstep(0.74, 0.96, entry);
      float armBlend = smoothstep(0.7, 0.99, entry);
      float walkWeight = (1.0 - walkFade) * u_motion;
      // A comfortable cadence of about 112 steps per minute. The keyframes
      // above follow the normal 60% stance / 40% swing gait cycle.
      float gaitCycle = fract(entry * 2.6041667);
      float leftPhase = gaitCycle;
      float rightPhase = fract(gaitCycle + 0.5);
      float supportWave = -sin(TAU * gaitCycle);
      float leftForward = cos(TAU * leftPhase);
      float rightForward = cos(TAU * rightPhase);
      vec2 pelvisTravel = vec2(
        0.022 * supportWave,
        -0.013 * cos(2.0 * TAU * gaitCycle)
      );
      float waveStart = max(0.0, u_time - 2.52);
      float wavePhase = waveStart * 3.45;
      float wave = sin(wavePhase) + 0.16 * sin(wavePhase * 2.0 + 0.7);
      float lateLift = smoother01((armBlend - 0.72) / 0.28);
      float waveMotion = smoother01(waveStart / 0.22) * lateLift * u_motion;
      float waveFollow = armBlend * waveMotion;
      float depthScale = 1.0;
      float depthAlpha = 1.0;

      if (!isField) {
        bool leftArm = a_part > 3.5 && a_part < 6.5;
        bool leftFore = a_part > 4.5 && a_part < 6.5;
        bool leftHand = a_part > 5.5 && a_part < 6.5;
        bool rightFinger = a_part > 15.5 && a_part < 20.5;
        bool rightPalm = a_part > 8.5 && a_part < 9.5;
        bool rightArm = (a_part > 6.5 && a_part < 9.5) || rightFinger;
        bool rightElbow = abs(a_part - 7.5) < 0.1;
        bool rightUpper = a_part > 6.5 && a_part < 7.5;
        bool rightForeOnly = a_part > 7.5 && a_part < 8.5;
        bool rightFore = (a_part > 7.5 && a_part < 9.5) || rightFinger;
        bool rightHand = (a_part > 8.5 && a_part < 9.5) || rightFinger;
        bool leftLeg = a_part > 9.5 && a_part < 12.5;
        bool leftThigh = a_part > 9.5 && a_part < 10.5;
        bool leftShin = a_part > 10.5 && a_part < 11.5;
        bool leftLower = a_part > 10.5 && a_part < 12.5;
        bool leftShoe = a_part > 11.5 && a_part < 12.5;
        bool rightLeg = a_part > 12.5 && a_part < 15.5;
        bool rightThigh = a_part > 12.5 && a_part < 13.5;
        bool rightShin = a_part > 13.5 && a_part < 14.5;
        bool rightLower = a_part > 13.5 && a_part < 15.5;
        bool rightShoe = a_part > 14.5 && a_part < 15.5;

        // Narrow phones render one surface pass at DPR 1. A small point-size
        // lift keeps the waving palm and fingers legible without adding dots.
        if (rightHand) {
          depthScale *= 1.0 + 0.14 * smoothstep(0.76, 0.88, u_scale.x);
        }

        // Each leg is a fixed-length hip-knee-ankle chain. The support foot
        // stays at its stage contact; the swing knee flexes forward in depth.
        if (leftLeg) {
          vec2 hipTarget;
          vec2 kneeTarget;
          vec2 ankleTarget;
          float hipProjection;
          float kneeProjection;
          float ankleProjection;
          solveLeg(
            -1.0,
            leftPhase,
            walkWeight,
            pelvisTravel,
            hipTarget,
            kneeTarget,
            ankleTarget,
            hipProjection,
            kneeProjection,
            ankleProjection
          );
          vec2 sourceHip = vec2(-LEG_X, 0.02);
          vec2 sourceKnee = vec2(-LEG_X, -0.43);
          vec2 sourceAnkle = vec2(-LEG_X, -0.84);
          if (leftThigh || leftShin) {
            vec2 thighSource = sourceKnee - sourceHip;
            vec2 shinSource = sourceAnkle - sourceKnee;
            float thighAlong = dot(a_position - sourceHip, thighSource)
              / max(dot(thighSource, thighSource), 0.0001);
            float shinAlong = dot(a_position - sourceKnee, shinSource)
              / max(dot(shinSource, shinSource), 0.0001);
            float thighProgress = boneAlong(a_position, sourceHip, sourceKnee);
            float shinProgress = boneAlong(a_position, sourceKnee, sourceAnkle);
            float kneeBlend = smoother01((a_position.y + 0.48) / 0.1);
            float thighPerspective = mix(
              hipProjection,
              kneeProjection,
              thighProgress
            );
            float shinPerspective = mix(
              kneeProjection,
              ankleProjection,
              shinProgress
            );
            float projection = mix(
              shinPerspective,
              thighPerspective,
              kneeBlend
            );
            vec2 thighCenter = mix(hipTarget, kneeTarget, thighAlong);
            vec2 shinCenter = mix(kneeTarget, ankleTarget, shinAlong);
            vec2 thighAxis = normalize(kneeTarget - hipTarget);
            vec2 shinAxis = normalize(ankleTarget - kneeTarget);
            vec2 thighNormal = vec2(-thighAxis.y, thighAxis.x);
            vec2 shinNormal = vec2(-shinAxis.y, shinAxis.x);
            vec2 blendedNormal = normalize(mix(
              shinNormal,
              thighNormal,
              kneeBlend
            ));
            float sourceAcross = a_position.x + LEG_X;
            point = mix(shinCenter, thighCenter, kneeBlend)
              + blendedNormal * sourceAcross * projection;
            depthScale *= projection;
            depthAlpha *= clamp(1.0 + 0.7 * (projection - 1.0), 0.9, 1.1);
          } else if (leftShoe) {
            float shoeProjection;
            deformShoe(
              a_position,
              sourceAnkle,
              ankleTarget,
              ankleProjection,
              leftPhase,
              walkWeight,
              point,
              shoeProjection
            );
            float combinedShoeProjection = ankleProjection * shoeProjection;
            depthScale *= combinedShoeProjection;
            depthAlpha *= clamp(
              1.0 + 0.7 * (combinedShoeProjection - 1.0),
              0.9,
              1.1
            );
          }
        }
        if (rightLeg) {
          vec2 hipTarget;
          vec2 kneeTarget;
          vec2 ankleTarget;
          float hipProjection;
          float kneeProjection;
          float ankleProjection;
          solveLeg(
            1.0,
            rightPhase,
            walkWeight,
            pelvisTravel,
            hipTarget,
            kneeTarget,
            ankleTarget,
            hipProjection,
            kneeProjection,
            ankleProjection
          );
          vec2 sourceHip = vec2(LEG_X, 0.02);
          vec2 sourceKnee = vec2(LEG_X, -0.43);
          vec2 sourceAnkle = vec2(LEG_X, -0.84);
          if (rightThigh || rightShin) {
            vec2 thighSource = sourceKnee - sourceHip;
            vec2 shinSource = sourceAnkle - sourceKnee;
            float thighAlong = dot(a_position - sourceHip, thighSource)
              / max(dot(thighSource, thighSource), 0.0001);
            float shinAlong = dot(a_position - sourceKnee, shinSource)
              / max(dot(shinSource, shinSource), 0.0001);
            float thighProgress = boneAlong(a_position, sourceHip, sourceKnee);
            float shinProgress = boneAlong(a_position, sourceKnee, sourceAnkle);
            float kneeBlend = smoother01((a_position.y + 0.48) / 0.1);
            float thighPerspective = mix(
              hipProjection,
              kneeProjection,
              thighProgress
            );
            float shinPerspective = mix(
              kneeProjection,
              ankleProjection,
              shinProgress
            );
            float projection = mix(
              shinPerspective,
              thighPerspective,
              kneeBlend
            );
            vec2 thighCenter = mix(hipTarget, kneeTarget, thighAlong);
            vec2 shinCenter = mix(kneeTarget, ankleTarget, shinAlong);
            vec2 thighAxis = normalize(kneeTarget - hipTarget);
            vec2 shinAxis = normalize(ankleTarget - kneeTarget);
            vec2 thighNormal = vec2(-thighAxis.y, thighAxis.x);
            vec2 shinNormal = vec2(-shinAxis.y, shinAxis.x);
            vec2 blendedNormal = normalize(mix(
              shinNormal,
              thighNormal,
              kneeBlend
            ));
            float sourceAcross = a_position.x - LEG_X;
            point = mix(shinCenter, thighCenter, kneeBlend)
              + blendedNormal * sourceAcross * projection;
            depthScale *= projection;
            depthAlpha *= clamp(1.0 + 0.7 * (projection - 1.0), 0.9, 1.1);
          } else if (rightShoe) {
            float shoeProjection;
            deformShoe(
              a_position,
              sourceAnkle,
              ankleTarget,
              ankleProjection,
              rightPhase,
              walkWeight,
              point,
              shoeProjection
            );
            float combinedShoeProjection = ankleProjection * shoeProjection;
            depthScale *= combinedShoeProjection;
            depthAlpha *= clamp(
              1.0 + 0.7 * (combinedShoeProjection - 1.0),
              0.9,
              1.1
            );
          }
        }

        // The authored taper supplies a continuous trouser silhouette; a
        // subtle front-surface scale and alpha falloff makes the dot cloud
        // read as cylindrical volume rather than two flat strips.
        if (leftThigh || leftShin || rightThigh || rightShin) {
          float denimCenter = a_position.x < 0.0 ? -LEG_X : LEG_X;
          float denimWidth = max(denimHalfWidthAt(a_position.y), 0.001);
          float denimAcross = clamp(
            (a_position.x - denimCenter) / denimWidth,
            -1.0,
            1.0
          );
          float denimFront = sqrt(max(0.0, 1.0 - denimAcross * denimAcross));
          depthScale *= mix(0.96, 1.09, denimFront);
          depthAlpha *= mix(0.96, 1.05, denimFront);
        }

        // Arm swing is sagittal. Projection, depth and a small inward hand arc
        // make the contralateral swing readable from the frontal viewpoint.
        float rightArmForward = leftForward;
        float leftArmForward = -leftForward;
        // Shoulder and arm depth share one projection. Their silhouette now
        // rotates with the rib cage instead of only changing dot brightness.
        float shoulderYaw = 0.13 * leftForward * walkWeight;
        float rightShoulderSag = (
          0.36 * max(rightArmForward, 0.0)
            - 0.27 * max(-rightArmForward, 0.0)
        ) * walkWeight;
        float leftShoulderSag = (
          0.36 * max(leftArmForward, 0.0)
            - 0.27 * max(-leftArmForward, 0.0)
        ) * walkWeight;
        float rightElbowFlex = (
          0.16 + 0.1 * max(rightArmForward, 0.0)
        ) * walkWeight;
        float leftElbowFlex = (
          0.16 + 0.1 * max(leftArmForward, 0.0)
        ) * walkWeight;
        float rightForeSag = rightShoulderSag + rightElbowFlex;
        float leftForeSag = leftShoulderSag + leftElbowFlex;

        if (leftArm) {
          vec2 leftShoulder = vec2(-0.238, 0.5);
          vec2 leftElbow = vec2(-0.34, 0.18);
          float projectedLeftElbowY = leftShoulder.y
            + (leftElbow.y - leftShoulder.y) * cos(leftShoulderSag);
          if (leftFore) {
            point.y = projectedLeftElbowY
              + (point.y - leftElbow.y) * cos(leftForeSag);
          } else {
            point.y = leftShoulder.y
              + (point.y - leftShoulder.y) * cos(leftShoulderSag);
          }
          float leftUpperDepth = sin(leftShoulderSag);
          float leftForeDepth = mix(leftUpperDepth, sin(leftForeSag), 0.46);
          float leftLimbDepth = leftFore ? leftForeDepth : leftUpperDepth;
          depthScale *= clamp(1.0 + 0.38 * leftLimbDepth, 0.86, 1.18);
          depthAlpha *= clamp(1.0 + 0.3 * leftLimbDepth, 0.88, 1.14);
          if (leftFore) {
            float leftDistal = clamp((0.18 - a_position.y) / 0.32, 0.0, 1.0);
            point.x += 0.028 * leftArmForward * leftDistal * walkWeight;
          }
          if (leftHand) {
            float leftPalmPlane = clamp((a_position.x + 0.36) / 0.09, 0.0, 1.0);
            depthScale *= 0.94 + 0.1 * leftPalmPlane;
            depthAlpha *= 0.92 + 0.12 * leftPalmPlane;
          }
        }

        if (rightArm) {
          vec2 rightShoulder = vec2(0.238, 0.5);
          vec2 raisedRightElbow = vec2(0.576, 0.501);
          vec2 sourcePoint = point;

          vec2 raisedRightWrist = vec2(0.483, 0.811);
          vec2 walkingRightElbow = vec2(0.34, 0.18);
          vec2 walkingRightWrist = vec2(0.32, -0.14);
          vec2 walkPoint = sourcePoint;

          // Map the authored wave bones onto full-length walking bones. Each
          // finger receives its own relaxed curve rather than collapsing into a star.
          if (a_part > 15.5 && a_part < 16.5) {
            walkPoint = remapFinger(sourcePoint, vec2(0.523, 0.894), vec2(0.534, 0.948), vec2(0.344, -0.236), vec2(0.35, -0.258), vec2(0.349, -0.276));
          } else if (a_part < 17.5 && rightFinger) {
            walkPoint = remapFinger(sourcePoint, vec2(0.5, 0.897), vec2(0.502, 0.964), vec2(0.328, -0.245), vec2(0.336, -0.271), vec2(0.333, -0.291));
          } else if (a_part < 18.5 && rightFinger) {
            walkPoint = remapFinger(sourcePoint, vec2(0.476, 0.897), vec2(0.469, 0.97), vec2(0.311, -0.248), vec2(0.32, -0.275), vec2(0.314, -0.296));
          } else if (a_part < 19.5 && rightFinger) {
            walkPoint = remapFinger(sourcePoint, vec2(0.453, 0.893), vec2(0.43, 0.955), vec2(0.294, -0.241), vec2(0.3, -0.265), vec2(0.292, -0.286));
          } else if (rightFinger) {
            walkPoint = remapFinger(sourcePoint, vec2(0.452, 0.859), vec2(0.407, 0.872), vec2(0.275, -0.187), vec2(0.26, -0.215), vec2(0.266, -0.237));
          } else if (rightPalm) {
            walkPoint = vec2(0.316, -0.195)
              + (sourcePoint - vec2(0.487, 0.848)) * vec2(0.98, -1.03);
          } else if (rightFore) {
            walkPoint = remapBone(sourcePoint, raisedRightElbow, raisedRightWrist, walkingRightElbow, walkingRightWrist);
          } else {
            walkPoint = remapBone(sourcePoint, rightShoulder, raisedRightElbow, rightShoulder, walkingRightElbow);
          }

          float rightDistal = rightFore
            ? clamp((walkingRightElbow.y - walkPoint.y) / 0.32, 0.0, 1.0)
            : 0.0;
          float projectedRightElbowY = rightShoulder.y
            + (walkingRightElbow.y - rightShoulder.y) * cos(rightShoulderSag);
          if (rightFore) {
            walkPoint.y = projectedRightElbowY
              + (walkPoint.y - walkingRightElbow.y) * cos(rightForeSag);
          } else {
            walkPoint.y = rightShoulder.y
              + (walkPoint.y - rightShoulder.y) * cos(rightShoulderSag);
          }
          walkPoint.x -= 0.028 * rightArmForward * rightDistal * walkWeight;

          // The wave is built separately from the original raised geometry.
          vec2 wavePoint = sourcePoint;
          float waveShoulder = 0.016 * sin(wavePhase - 0.4) * waveMotion;
          float waveElbow = 0.09 * wave * waveMotion;
          float waveWrist = 0.13
            * (sin(wavePhase) + 0.1 * sin(wavePhase * 2.0 + 0.5))
            * waveMotion;
          float handYaw = sin(wavePhase * 0.92 + 0.25) * waveMotion;
          if (rightHand) {
            wavePoint = rotateAround(wavePoint, raisedRightWrist, waveWrist);
          }
          if (rightFore) wavePoint = rotateAround(wavePoint, raisedRightElbow, waveElbow);
          wavePoint = rotateAround(wavePoint, rightShoulder, waveShoulder);
          float handBlend = armBlend;
          float handPoseBlend = smoother01((handBlend - 0.42) / 0.5);
          vec2 walkElbowPoint = vec2(walkingRightElbow.x, projectedRightElbowY);
          vec2 waveElbowPoint = rotateAround(
            raisedRightElbow,
            rightShoulder,
            waveShoulder
          );
          vec2 projectedWalkingWrist = vec2(
            walkingRightWrist.x - 0.028 * rightArmForward * walkWeight,
            projectedRightElbowY
              + (walkingRightWrist.y - walkingRightElbow.y) * cos(rightForeSag)
          );
          vec2 projectedWaveWrist = rotateAround(
            raisedRightWrist,
            raisedRightElbow,
            waveElbow
          );
          projectedWaveWrist = rotateAround(
            projectedWaveWrist,
            rightShoulder,
            waveShoulder
          );

          // Build the lift as two three-dimensional bones. The depth arcs pick
          // a real rotation plane for the nearly opposite walking and waving
          // forearm directions; camera projection then supplies foreshortening
          // and width perspective from those same joint depths.
          float liftDepthPhase = sin(PI * handBlend) * u_motion;
          vec2 walkUpper = walkElbowPoint - rightShoulder;
          vec2 waveUpper = waveElbowPoint - rightShoulder;
          vec3 shoulderJoint3 = vec3(rightShoulder, 0.0);
          vec3 upperDirection3 = normalize(
            mix(
              vec3(normalize(walkUpper), 0.0),
              vec3(normalize(waveUpper), 0.0),
              handBlend
            ) + vec3(0.0, 0.0, 0.52 * liftDepthPhase)
          );
          float upperLength = mix(
            length(walkUpper),
            length(waveUpper),
            handBlend
          );
          vec3 elbowJoint3 = shoulderJoint3 + upperDirection3 * upperLength;

          vec2 walkFore = projectedWalkingWrist - walkElbowPoint;
          vec2 waveFore = projectedWaveWrist - waveElbowPoint;
          vec3 foreDirection3 = normalize(
            mix(
              vec3(normalize(walkFore), 0.0),
              vec3(normalize(waveFore), 0.0),
              handBlend
            ) + vec3(
              0.28 * liftDepthPhase,
              0.22 * liftDepthPhase,
              0.62 * liftDepthPhase
            )
          );
          float foreLength = mix(
            length(walkFore),
            length(waveFore),
            handBlend
          );
          vec3 wristJoint3 = elbowJoint3 + foreDirection3 * foreLength;
          float elbowPerspective = armPerspective(elbowJoint3.z);
          float wristPerspective = armPerspective(wristJoint3.z);
          vec2 liftElbow = projectArmJoint(elbowJoint3, rightShoulder);
          vec2 liftWrist = projectArmJoint(wristJoint3, rightShoulder);
          float handParticlePerspective = wristPerspective;

          if (rightHand) {
            float walkForeAngle = atan(walkFore.y, walkFore.x);
            float waveForeAngle = atan(waveFore.y, waveFore.x);
            float liftForeAngle = atan(
              liftWrist.y - liftElbow.y,
              liftWrist.x - liftElbow.x
            );
            vec2 alignedWalkHand = rotateAround(
              walkPoint,
              projectedWalkingWrist,
              liftForeAngle - walkForeAngle
            ) - projectedWalkingWrist;
            vec2 alignedWaveHand = rotateAround(
              wavePoint,
              projectedWaveWrist,
              liftForeAngle - waveForeAngle
            ) - projectedWaveWrist;
            vec2 handLocal = mix(
              alignedWalkHand,
              alignedWaveHand,
              handPoseBlend
            );
            vec2 projectedForeAxis = normalize(
              liftWrist - liftElbow + vec2(0.0001)
            );
            vec2 projectedHandSide = vec2(
              -projectedForeAxis.y,
              projectedForeAxis.x
            );
            float handAlong = dot(handLocal, projectedForeAxis);
            float handAcross = dot(handLocal, projectedHandSide);
            float handPlaneTurn = 0.52 * sin(PI * handBlend) * u_motion
              + 0.25 * handYaw * handPoseBlend;
            // Build an orthonormal frame around the actual 3D forearm. This
            // rotates the palm in depth without shearing it along the arm.
            vec3 foreAxis3 = normalize(foreDirection3);
            vec3 handSideBase3 = normalize(vec3(
              -foreAxis3.y,
              foreAxis3.x,
              0.0
            ));
            vec3 handNormal3 = normalize(cross(
              foreAxis3,
              handSideBase3
            ));
            vec3 handSide3 = handSideBase3 * cos(handPlaneTurn)
              + handNormal3 * sin(handPlaneTurn);
            float handVolume = 1.0 + 0.18 * liftDepthPhase;
            vec3 handWorld = wristJoint3
              + foreDirection3 * handAlong
              + handSide3 * handAcross * handVolume;
            float handProjection = armPerspective(handWorld.z);
            handParticlePerspective = 1.0
              + 0.55 * (handProjection - 1.0);
            point = projectArmJoint(handWorld, rightShoulder);
          }

          if (rightElbow) {
            point = liftElbow
              + (sourcePoint - raisedRightElbow) * elbowPerspective;
          } else if (rightUpper) {
            point = remapBonePerspective(
              sourcePoint,
              rightShoulder,
              raisedRightElbow,
              rightShoulder,
              liftElbow,
              1.0,
              elbowPerspective
            );
          } else if (rightForeOnly) {
            point = remapBonePerspective(
              sourcePoint,
              raisedRightElbow,
              raisedRightWrist,
              liftElbow,
              liftWrist,
              elbowPerspective,
              wristPerspective
            );
          }

          vec2 upperAxis = raisedRightElbow - rightShoulder;
          vec2 foreAxis = raisedRightWrist - raisedRightElbow;
          float upperProgress = clamp(
            dot(sourcePoint - rightShoulder, upperAxis)
              / max(dot(upperAxis, upperAxis), 0.0001),
            0.0,
            1.0
          );
          float foreProgress = clamp(
            dot(sourcePoint - raisedRightElbow, foreAxis)
              / max(dot(foreAxis, foreAxis), 0.0001),
            0.0,
            1.0
          );
          float limbPerspective = rightElbow
            ? elbowPerspective
            : (
              rightUpper
                ? mix(1.0, elbowPerspective, upperProgress)
                : (
                  rightForeOnly
                    ? mix(elbowPerspective, wristPerspective, foreProgress)
                    : handParticlePerspective
                )
            );
          depthScale *= limbPerspective;
          depthAlpha *= clamp(
            1.0 + 0.35 * (limbPerspective - 1.0),
            0.96,
            1.1
          );

          float rightUpperDepth = sin(rightShoulderSag);
          float rightForeDepth = mix(rightUpperDepth, sin(rightForeSag), 0.46);
          float elbowWalkDepth = mix(rightUpperDepth, rightForeDepth, 0.5);
          float rightLimbDepth = (
            rightElbow
              ? elbowWalkDepth
              : (rightFore ? rightForeDepth : rightUpperDepth)
          ) * (1.0 - handBlend);
          depthScale *= clamp(1.0 + 0.38 * rightLimbDepth, 0.86, 1.18);
          depthAlpha *= clamp(1.0 + 0.3 * rightLimbDepth, 0.88, 1.14);
        }

        if (leftArm || rightArm) {
          float armSide = leftArm ? -1.0 : 1.0;
          float upperAlong = leftArm
            ? clamp((0.5 - a_position.y) / 0.32, 0.0, 1.0)
            : (rightUpper ? boneAlong(a_position, vec2(0.238, 0.5), vec2(0.576, 0.501)) : 1.0);
          float foreAlong = leftArm
            ? max(0.0, (0.18 - a_position.y) / 0.32)
            : (rightForeOnly ? boneAlong(a_position, vec2(0.576, 0.501), vec2(0.483, 0.811)) : (rightHand ? 1.0 : 0.0));
          float shoulderSag = leftArm ? leftShoulderSag : rightShoulderSag;
          float foreSag = leftArm ? leftForeSag : rightForeSag;
          float armDepth = armSide * 0.238 * sin(shoulderYaw)
            + 0.32 * upperAlong * sin(shoulderSag)
            + 0.32 * foreAlong * sin(foreSag);
          float armProjection = armPerspective(armDepth);
          point = vec2(0.0, 0.5) + (point - vec2(0.0, 0.5)) * armProjection;
          point.x *= cos(shoulderYaw);
          depthScale *= armProjection;
        }

        bool corePart = a_part > 2.5 && a_part < 3.5;
        bool faceParts = a_part < 2.5;
        bool upperBody = a_part < 9.5 || rightFinger;
        float pelvisInfluence = corePart
          ? 1.0 - smoothstep(0.02, 0.22, a_position.y)
          : 0.0;
        float pelvisRoll = 0.04 * supportWave * walkWeight;
        float trunkLean = -0.022 * supportWave * walkWeight;
        float waveRock = sin(wavePhase - 0.4);
        float torsoAngle = trunkLean
          + (0.009 + 0.006 * waveRock) * waveFollow;

        // The pelvis transfers weight over the stance leg while the trunk and
        // head counter-rotate. A smooth core blend keeps the shirt connected.
        if (faceParts) {
          float headStep = sin(2.0 * TAU * gaitCycle + 0.35);
          float headWalkAngle = -0.75 * trunkLean
            + 0.0045 * headStep * walkWeight;
          point = rotateAround(
            point,
            vec2(0.0, 0.625),
            headWalkAngle
              - 0.0075 * sin(wavePhase - 0.95) * waveFollow
          );

          // A subtle transverse turn makes the head read as a three-dimensional
          // counterbalance. The mask keeps the neck base rigid and connected.
          float craniumMask = smoothstep(0.69, 0.76, a_position.y);
          point.y += 0.0045 * headStep * craniumMask * walkWeight;
          float headSide = clamp(a_position.x / 0.13, -1.0, 1.0);
          float headTurn = -0.75 * leftForward * walkWeight * craniumMask;
          point.x += 0.006 * headTurn;
          depthScale *= 1.0 + 0.034 * headSide * headTurn;
          depthAlpha *= clamp(1.0 + 0.018 * headSide * headTurn, 0.96, 1.04);
        }
        if (corePart) {
          // Cloth around the raised armhole follows the sleeve without moving
          // the shared shoulder pivot. The lower edge drapes below the armhole
          // the collar, opposite side, waist and jeans remain undisturbed.
          vec2 clothPivot = vec2(0.238, 0.5);
          vec2 clothLocal = point - clothPivot;
          float clothRadius = length(clothLocal);
          float clothSide = smoothstep(0.1, 0.23, a_position.x);
          float clothBand = smoothstep(0.39, 0.47, a_position.y)
            * (1.0 - smoothstep(0.565, 0.61, a_position.y));
          float clothMask = clothSide * clothBand;
          float clothElevation = smoother01((armBlend - 0.12) / 0.88);
          float clothDepth = sin(PI * armBlend) * u_motion;
          float clothAngle = 0.13 * clothElevation
            + 0.004 * sin(wavePhase - 0.4) * waveMotion;
          vec2 clothTarget = clothPivot + vec2(
            clothLocal.x * (1.0 - 0.07 * clothDepth),
            clothLocal.y * (1.0 + 0.04 * clothElevation)
          );
          clothTarget = rotateAround(
            clothTarget,
            clothPivot,
            clothAngle
          );
          float anchorRelease = smoothstep(
            0.015,
            0.07,
            clothRadius
          );
          float underside = (
            1.0 - smoothstep(0.47, 0.525, a_position.y)
          ) * anchorRelease;
          float upperArmholePull = smoothstep(
            0.54,
            0.568,
            a_position.y
          ) * (
            1.0 - smoothstep(0.568, 0.608, a_position.y)
          ) * anchorRelease;
          clothTarget.x += 0.018
            * clothElevation
            * upperArmholePull;
          clothTarget += vec2(0.004, -0.004)
            * clothElevation
            * underside;
          point = mix(point, clothTarget, clothMask);
          float underarmHang = clothElevation
            * clothSide
            * smoothstep(0.33, 0.405, a_position.y)
            * (1.0 - smoothstep(0.455, 0.515, a_position.y))
            * smoothstep(0.052, 0.13, clothRadius);
          point += vec2(0.014, -0.014) * underarmHang;
          float clothFront = clothDepth * clothMask * anchorRelease;
          depthScale *= 1.0 + 0.035 * clothFront;
          depthAlpha *= 1.0 + 0.018 * clothFront;

          // At each sleeve root this matches the arm's depth projection;
          // blend through the chest into the opposite rotation of the pelvis.
          float shoulderBand = smoothstep(0.18, 0.48, a_position.y);
          float torsoYaw = mix(-0.08 * leftForward * walkWeight, shoulderYaw, shoulderBand);
          float torsoDepth = point.x * sin(torsoYaw);
          float torsoProjection = armPerspective(torsoDepth);
          point = vec2(0.0, 0.5) + (point - vec2(0.0, 0.5)) * torsoProjection;
          point.x *= cos(torsoYaw);
          depthScale *= torsoProjection;

          point = rotateAround(
            point,
            vec2(0.0, 0.02),
            (pelvisRoll - 0.003 * waveFollow) * pelvisInfluence
          );
          point = rotateAround(
            point,
            vec2(0.0, 0.06),
            torsoAngle * (1.0 - pelvisInfluence)
          );
        } else if (upperBody) {
          point = rotateAround(point, vec2(0.0, 0.06), torsoAngle);
        }

        // Opposed shoulder and pelvis depth gives the torso a transverse twist
        // instead of reading as a rigid card above the moving legs.
        if (corePart) {
          float torsoSide = clamp(a_position.x / 0.22, -1.0, 1.0);
          float shoulderMask = smoothstep(0.28, 0.56, a_position.y);
          float pelvisMask = 1.0 - smoothstep(0.04, 0.16, a_position.y);
          float planeDepth = torsoSide * leftForward
            * (0.085 * shoulderMask - 0.05 * pelvisMask)
            * walkWeight;
          depthScale *= 1.0 + planeDepth;
          depthAlpha *= clamp(1.0 + 0.7 * planeDepth, 0.94, 1.06);
        }

        if (!leftLeg && !rightLeg) {
          point += pelvisTravel * walkWeight;
        }

        vec2 waveTranslation = vec2(
          -0.008 + 0.004 * waveRock,
          0.0025 * sin(wavePhase - 0.75)
        ) * waveFollow;
        float wavePartFollow = 1.0;
        if (leftLeg || rightLeg) {
          wavePartFollow = 0.08
            + 0.37 * smoothstep(-0.97, -0.84, a_position.y)
            + 0.3 * smoothstep(-0.84, -0.43, a_position.y)
            + 0.25 * smoothstep(-0.43, 0.02, a_position.y);
        }
        point.x += waveTranslation.x * wavePartFollow;
        point.y += waveTranslation.y * wavePartFollow;
        point = personaStagePoint(point, entry);

        vec2 figureClip = point * u_scale + u_figure_offset;
        vec2 scatterRandom = hash21(a_seed * 8192.0 + a_twinkle * 101.0);
        vec2 scatterTarget = vec2(mix(-1.3, -0.68, scatterRandom.x), mix(-1.08, 1.08, scatterRandom.y));
        float scatterStart = 0.3 + a_seed * 0.12;
        float scatterEnd = 0.86 + a_seed * 0.1;
        float scatterAmount = smoothstep(scatterStart, scatterEnd, u_scroll) * smoothstep(0.72, 0.94, entry);
        vec2 scatterDirection = scatterTarget - figureClip;
        vec2 tangent = normalize(vec2(-scatterDirection.y, scatterDirection.x) + vec2(0.0001));
        float arc = sin(scatterAmount * PI) * (0.06 + 0.12 * a_twinkle);
        vec2 clipPosition = mix(figureClip, scatterTarget, scatterAmount) + tangent * arc + u_channel_offset;
        gl_Position = vec4(clipPosition, 0.0, 1.0);
        float entrancePointScale = mix(0.68, 1.0, approach);
        gl_PointSize = max(1.0, particleSize * u_dpr * entrancePointScale * depthScale * 1.16);
        float textProtection = mix(0.16, 1.0, smoothstep(-0.38, 0.12, clipPosition.x));
        textProtection = max(textProtection, smoothstep(0.7, 1.0, u_scroll) * 0.42);
        float personaExit = 1.0 - smoothstep(0.86, 1.0, u_scroll);
        v_alpha = u_alpha
          * depthAlpha
          * mix(1.0, 0.16, scatterAmount)
          * textProtection
          * personaExit;
      } else {
        point.x += sin(u_time * 0.31 + a_seed * 19.0) * 0.012 * u_motion;
        point.y += cos(u_time * 0.27 + a_seed * 17.0) * 0.009 * u_motion;
        point.x -= u_scroll * (0.18 + a_seed * 0.26);
        point.y -= u_scroll * (0.04 + a_seed * 0.08);
        vec2 fieldFigureCenter = u_figure_offset
          + vec2((1.0 - approach) * personaApproachTravelX() * u_scale.x, 0.0);
        vec2 fieldAroundFigure = vec2(
          (point.x - fieldFigureCenter.x) / max(u_scale.x * 0.72, 0.001),
          (point.y - fieldFigureCenter.y) / max(u_scale.y * 1.08, 0.001)
        );
        float fieldOutsideFigure = smoothstep(
          0.74,
          1.12,
          length(fieldAroundFigure)
        );
        float fieldRelease = smoothstep(0.42, 0.9, u_scroll)
          * smoothstep(0.72, 0.94, entry);
        float fieldClearStrength = 1.0 - fieldRelease;
        float fieldFigureAlpha = mix(
          1.0,
          mix(0.18, 1.0, fieldOutsideFigure),
          fieldClearStrength
        );
        point += u_channel_offset;
        gl_Position = vec4(point, 0.0, 1.0);
        gl_PointSize = max(1.0, particleSize * u_dpr * (0.9 + u_scroll * 0.22));
        float fieldProtection = mix(0.12, 1.0, smoothstep(-0.42, 0.08, point.x));
        fieldProtection = max(fieldProtection, smoothstep(0.7, 1.0, u_scroll) * 0.32);
        v_alpha = u_alpha
          * (0.2 + u_scroll * 0.17)
          * fieldProtection
          * fieldFigureAlpha;
      }

      float twinkle = 0.92 + sin(u_time * 1.35 + a_twinkle * 18.0) * 0.08 * u_motion;
      float effectiveTint = u_force_tint;
      bool shirtCore = abs(a_part - 3.0) < 0.1;
      bool denimThigh = (a_part > 9.5 && a_part < 10.5)
        || (a_part > 12.5 && a_part < 13.5);
      bool denimShin = (a_part > 10.5 && a_part < 11.5)
        || (a_part > 13.5 && a_part < 14.5);
      bool denimLeg = denimThigh || denimShin;
      bool denimWaist = abs(a_part - WAIST_PART) < 0.1;
      bool denimMaterial = denimLeg || denimWaist;
      bool shoeMaterial = (a_part > 11.5 && a_part < 12.5)
        || (a_part > 14.5 && a_part < 15.5);
      bool hairMaterial = abs(a_part - 1.0) < 0.1;
      // Preserve warm facial planes and fine feature contrast in the desktop
      // cyan echo. Sunglasses retain their authored treatment.
      if (a_part < 0.5) effectiveTint *= 0.35;
      // Keep hair charcoal instead of washing it into the navy/cyan stage.
      if (hairMaterial) {
        effectiveTint *= 0.12;
        float hairEchoPass = step(0.5, u_force_tint);
        v_alpha *= mix(1.0, 0.42, hairEchoPass);
      }
      // Keep the shirt neutral and give denim only a restrained blue echo.
      // The surface pass is untouched; only the desktop additive pass fades.
      if (shirtCore) effectiveTint *= 0.08;
      if (denimMaterial) {
        effectiveTint *= 0.18;
        float denimEchoPass = step(0.5, u_force_tint);
        v_alpha *= mix(1.0, 0.42, denimEchoPass);
      }
      if (shoeMaterial) {
        effectiveTint *= 0.28;
        float shoeEchoPass = step(0.5, u_force_tint);
        v_alpha *= mix(1.0, 0.65, shoeEchoPass);
      }
      if (a_part > 6.5 && a_part < 7.5) {
        float sourceChroma = max(
          abs(a_color.r - a_color.g),
          max(
            abs(a_color.g - a_color.b),
            abs(a_color.r - a_color.b)
          )
        );
        float neutralCloth = 1.0
          - smoothstep(0.035, 0.12, sourceChroma);
        float proximalFade = 1.0 - smoothstep(
          0.15,
          0.225,
          distance(a_position, vec2(0.238, 0.5))
        );
        float sleeveMask = max(neutralCloth, proximalFade);
        effectiveTint *= mix(1.0, 0.08, sleeveMask);
      }
      float silhouetteEchoPass = step(0.5, u_force_tint);
      v_alpha *= mix(
        1.0,
        0.55,
        silhouette * silhouetteEchoPass
      );
      float sourceLuma = dot(a_color, vec3(0.2126, 0.7152, 0.0722));
      float detailLift = mix(1.14, 1.03, smoothstep(0.2, 0.9, sourceLuma));
      vec3 litColor = mix(a_color, u_tint, effectiveTint);
      if (hairMaterial) {
        float surfacePass = 1.0 - step(0.5, u_force_tint);
        float darkHair = 1.0 - smoothstep(0.12, 0.3, sourceLuma);
        litColor = mix(
          litColor,
          max(litColor, vec3(0.16, 0.17, 0.19)),
          0.62 * darkHair * surfacePass
        );
      }
      if (denimMaterial) {
        float legCenter = a_position.x < 0.0 ? -LEG_X : LEG_X;
        float legHalfWidth = max(denimHalfWidthAt(a_position.y), 0.001);
        float across = denimWaist
          ? clamp(a_position.x / 0.2, -1.0, 1.0)
          : clamp((a_position.x - legCenter) / legHalfWidth, -1.0, 1.0);
        float front = sqrt(max(0.0, 1.0 - across * across));
        float lightArrival = smoother01((approach - 0.04) / 0.9);
        float sideKey = mix(0.72, 0.2, lightArrival);
        float lowerWaist = denimWaist
          ? smoother01((-0.075 - a_position.y) / 0.085)
          : 0.0;
        float waistVolume = mix(
          0.92 + 0.08 * front,
          0.86 + 0.06 * front,
          lowerWaist
        );
        float volume = denimWaist
          ? waistVolume
          : 0.8 + 0.24 * front + 0.06 * across * sideKey;
        float centerCrease = denimLeg
          ? 1.0 - smoothstep(0.018, 0.06, abs(a_position.x - legCenter))
          : 0.0;
        float forwardLeg = a_position.x < 0.0 ? leftForward : rightForward;
        float gaitKey = denimLeg
          ? 1.0 + 0.055 * forwardLeg * walkWeight
          : 1.0;
        float stageGain = mix(0.86, 1.0, lightArrival)
          * volume
          * gaitKey
          * (0.96 + 0.04 * a_twinkle);
        stageGain *= 1.0 - 0.025 * centerCrease;
        if (denimWaist) stageGain = min(stageGain, 1.04);
        float denimHighlight = denimWaist
          ? 0.01
          : 0.012 + 0.03 * front * front;
        litColor = mix(
          litColor * stageGain,
          vec3(0.3, 0.4, 0.53),
          denimHighlight * lightArrival
        );
      }
      v_color = litColor * twinkle * detailLift
        * mix(1.0, 1.08, silhouette);
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec3 v_color;
    varying float v_alpha;
    varying float v_silhouette;

    void main() {
      float distanceFromCenter = length(gl_PointCoord - vec2(0.5)) * 2.0;
      float core = 1.0 - smoothstep(0.14, 0.56, distanceFromCenter);
      float haloStrength = mix(0.42, 0.3, v_silhouette);
      float halo = (1.0 - smoothstep(0.18, 1.0, distanceFromCenter))
        * haloStrength;
      float alpha = (core + halo) * v_alpha;
      if (alpha < 0.014) discard;
      gl_FragColor = vec4(v_color * (0.96 + core * 0.54), alpha);
    }
  `;

  function createSvgFallbackRenderer(canvas, particleData) {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    const fieldGroup = document.createElementNS(namespace, "g");
    const figureGroup = document.createElementNS(namespace, "g");
    svg.classList.add("persona-svg-fallback");
    svg.setAttribute("viewBox", "-1.1 -1.05 2.2 2.1");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");

    const particleCount = particleData.length / FLOATS_PER_PARTICLE;
    const fallbackStride = Math.max(1, Math.ceil(particleCount / 1500));
    for (let index = 0; index < particleData.length; index += FLOATS_PER_PARTICLE * fallbackStride) {
      const part = particleData[index + 2];
      const circle = document.createElementNS(namespace, "circle");
      const red = Math.round(particleData[index + 5] * 255);
      const green = Math.round(particleData[index + 6] * 255);
      const blue = Math.round(particleData[index + 7] * 255);
      const size = Math.abs(particleData[index + 4]);
      circle.setAttribute("cx", particleData[index].toFixed(4));
      circle.setAttribute("cy", (-particleData[index + 1]).toFixed(4));
      circle.setAttribute("r", (0.0044 + size * 0.0012).toFixed(4));
      circle.setAttribute("fill", `rgb(${red} ${green} ${blue})`);
      circle.setAttribute("opacity", part > 20.5 ? "0.2" : "0.88");
      if (part > 20.5) fieldGroup.appendChild(circle);
      else figureGroup.appendChild(circle);
    }

    svg.append(fieldGroup, figureGroup);
    canvas.insertAdjacentElement("afterend", svg);
    let cssWidth = 1;
    let cssHeight = 1;

    function resize(width, height) {
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);
      cssWidth = safeWidth;
      cssHeight = safeHeight;
      const aspect = safeWidth / safeHeight;
      const figureScale = getFigureScale(safeWidth, safeHeight);
      const placement = getFigurePlacement(safeWidth, safeHeight);
      const objectScale = figureScale * 2 / safeHeight;

      svg.setAttribute("viewBox", `${-aspect} -1 ${aspect * 2} 2`);
      fieldGroup.setAttribute("transform", `scale(${aspect} 1)`);
      figureGroup.setAttribute("transform", `translate(${placement.offsetX * aspect} ${-placement.offsetY}) scale(${objectScale})`);
    }

    function getFigureAnchor(sequenceProgress = 1) {
      const entry = Math.max(0, Math.min(1, sequenceProgress / 0.96));
      const approach = entry * entry * (3 - 2 * entry);
      const figureScale = getFigureScale(cssWidth, cssHeight);
      const placement = getFigurePlacement(cssWidth, cssHeight);
      const scaleX = figureScale * 2 / cssWidth;
      const scaleY = figureScale * 2 / cssHeight;
      const clipX = placement.offsetX
        + (1 - approach) * Math.min(placement.approachX, 0.32 * scaleX);
      const floorClipY = (-0.969 + (1 - approach) * 0.20)
        * scaleY + placement.offsetY;
      return {
        x: (clipX + 1) * 0.5 * cssWidth,
        y: (1 - floorClipY) * 0.5 * cssHeight,
        approach
      };
    }

    return {
      fallback: true,
      needsFrameLoop: false,
      resize,
      getFigureAnchor,
      render() { return true; },
      setPaused() {}
    };
  }

  window.createPersonaRenderer = function createPersonaRenderer(canvas) {
    const particleData = buildPersonaParticles();
    let gl = null;
    if (typeof canvas.getContext === "function") {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "low-power"
      });
    }
    if (!gl) return createSvgFallbackRenderer(canvas, particleData);

    const particleCount = particleData.length / FLOATS_PER_PARTICLE;
    let program = null;
    let buffer = null;
    let locations = null;
    let cssWidth = 1;
    let cssHeight = 1;
    let pixelRatio = 1;
    let contextLost = false;

    function initializeResources() {
      program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);
      locations = {
        position: gl.getAttribLocation(program, "a_position"),
        part: gl.getAttribLocation(program, "a_part"),
        seed: gl.getAttribLocation(program, "a_seed"),
        size: gl.getAttribLocation(program, "a_size"),
        color: gl.getAttribLocation(program, "a_color"),
        twinkle: gl.getAttribLocation(program, "a_twinkle"),
        time: gl.getUniformLocation(program, "u_time"),
        scroll: gl.getUniformLocation(program, "u_scroll"),
        sequence: gl.getUniformLocation(program, "u_sequence"),
        dpr: gl.getUniformLocation(program, "u_dpr"),
        motion: gl.getUniformLocation(program, "u_motion"),
        approachX: gl.getUniformLocation(program, "u_approach_x"),
        scale: gl.getUniformLocation(program, "u_scale"),
        figureOffset: gl.getUniformLocation(program, "u_figure_offset"),
        channelOffset: gl.getUniformLocation(program, "u_channel_offset"),
        tint: gl.getUniformLocation(program, "u_tint"),
        forceTint: gl.getUniformLocation(program, "u_force_tint"),
        alpha: gl.getUniformLocation(program, "u_alpha")
      };

      const stride = FLOATS_PER_PARTICLE * Float32Array.BYTES_PER_ELEMENT;
      [[locations.position, 2, 0], [locations.part, 1, 2], [locations.seed, 1, 3], [locations.size, 1, 4], [locations.color, 3, 5], [locations.twinkle, 1, 8]].forEach(([location, size, offset]) => {
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
      });
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
    }

    function resize(width, height, requestedDpr) {
      cssWidth = Math.max(1, Math.round(width));
      cssHeight = Math.max(1, Math.round(height));
      const requestedRatio = Math.max(1, requestedDpr);
      const areaLimitedRatio = Math.sqrt(2400000 / Math.max(cssWidth * cssHeight, 1));
      pixelRatio = Math.max(0.25, Math.min(requestedRatio, areaLimitedRatio));
      const backingWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
      const backingHeight = Math.max(1, Math.round(cssHeight * pixelRatio));
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function getFigureAnchor(sequenceProgress = 1) {
      const entry = Math.max(0, Math.min(1, sequenceProgress / 0.96));
      const approach = entry * entry * (3 - 2 * entry);
      const figureScale = getFigureScale(cssWidth, cssHeight);
      const placement = getFigurePlacement(cssWidth, cssHeight);
      const scaleX = figureScale * 2 / cssWidth;
      const scaleY = figureScale * 2 / cssHeight;
      const clipX = placement.offsetX
        + (1 - approach) * Math.min(placement.approachX, 0.32 * scaleX);
      const floorClipY = (-0.969 + (1 - approach) * 0.20)
        * scaleY + placement.offsetY;

      return {
        x: (clipX + 1) * 0.5 * cssWidth,
        y: (1 - floorClipY) * 0.5 * cssHeight,
        approach
      };
    }

    function render({ time = 0, scrollProgress = 0, sequenceProgress = 1, motion = true } = {}) {
      if (contextLost || !program || gl.isContextLost()) return false;
      const isMobile = cssWidth <= 700;
      const figureScale = getFigureScale(cssWidth, cssHeight);
      const placement = getFigurePlacement(cssWidth, cssHeight);
      const scaleX = figureScale * 2 / cssWidth;
      const scaleY = figureScale * 2 / cssHeight;
      const passes = isMobile || figureScale < 180 ? MOBILE_RENDER_PASSES : RENDER_PASSES;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.uniform1f(locations.time, time);
      gl.uniform1f(locations.scroll, Math.max(0, Math.min(1, scrollProgress)));
      gl.uniform1f(locations.sequence, Math.max(0, Math.min(1, sequenceProgress)));
      gl.uniform1f(locations.dpr, pixelRatio);
      gl.uniform1f(locations.motion, motion ? 1 : 0);
      gl.uniform1f(locations.approachX, placement.approachX);
      gl.uniform2f(locations.scale, scaleX, scaleY);
      gl.uniform2f(locations.figureOffset, placement.offsetX, placement.offsetY);
      passes.forEach((pass) => {
        if (pass.blend === "additive") {
          gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        } else {
          gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }
        gl.uniform2f(locations.channelOffset, pass.offset[0] * pixelRatio * 2 / canvas.width, pass.offset[1] * pixelRatio * 2 / canvas.height);
        gl.uniform3fv(locations.tint, pass.tint);
        gl.uniform1f(locations.forceTint, pass.force);
        gl.uniform1f(locations.alpha, pass.alpha);
        gl.drawArrays(gl.POINTS, 0, particleCount);
      });
      return true;
    }

    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      contextLost = true;
    });
    canvas.addEventListener("webglcontextrestored", () => {
      try {
        initializeResources();
        resize(cssWidth, cssHeight, pixelRatio);
        contextLost = false;
      } catch (error) {
        contextLost = true;
        console.warn(error);
      }
    });

    try {
      initializeResources();
    } catch (error) {
      console.warn(error);
      return createSvgFallbackRenderer(canvas, particleData);
    }
    return { fallback: false, needsFrameLoop: true, resize, render, getFigureAnchor, setPaused() {} };
  };
}());
