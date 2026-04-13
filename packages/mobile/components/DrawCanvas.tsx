import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { fonts } from '@jotbunker/shared';
import { useTheme } from '../hooks/useTheme';

interface Props {
  savedPaths?: string | null;
  onPathsChange?: (pathsJson: string | null) => void;
}

export default function DrawCanvas({ savedPaths, onPathsChange }: Props) {
  const { colors, drawCanvas: d } = useTheme();

  const [completedPaths, setCompletedPaths] = useState<string[]>(() => {
    if (savedPaths) {
      try { return JSON.parse(savedPaths); } catch { return []; }
    }
    return [];
  });
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const pathRef = useRef<string>('');
  const onPathsChangeRef = useRef(onPathsChange);
  onPathsChangeRef.current = onPathsChange;

  // Sync local state when savedPaths is cleared externally (e.g. red "clear jot" button)
  useEffect(() => {
    if (!savedPaths) {
      setCompletedPaths([]);
      setCurrentPath(null);
      pathRef.current = '';
    }
  }, [savedPaths]);

  const hasContent = completedPaths.length > 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderRelease: () => {
        const finished = pathRef.current;
        pathRef.current = '';
        setCurrentPath(null);
        if (finished) {
          setCompletedPaths((prev) => {
            const updated = [...prev, finished];
            setTimeout(() => onPathsChangeRef.current?.(JSON.stringify(updated)), 0);
            return updated;
          });
        }
      },
    })
  ).current;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    canvas: {
      flex: 1,
      width: '100%',
    },
    hint: {
      position: 'absolute',
      bottom: d.hintBottom,
      alignSelf: 'center',
      color: d.hintColor,
      fontSize: d.hintFontSize,
      fontFamily: `${fonts.sans}-Regular`,
      letterSpacing: d.hintFontSize * d.hintLetterSpacing,
    },
  }), [colors, d]);

  return (
    <View style={styles.container}>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {completedPaths.map((pathData, i) => (
            <SvgPath
              key={i}
              d={pathData}
              stroke={d.strokeColor}
              strokeWidth={d.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath && (
            <SvgPath
              d={currentPath}
              stroke={d.strokeColor}
              strokeWidth={d.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </View>
      {!hasContent && (
        <Text style={styles.hint}>DRAW WITH FINGER</Text>
      )}
    </View>
  );
}
