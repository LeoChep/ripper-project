/**
 * visibility_polygon.js version 1.9
 * TypeScript Type Definitions
 * 
 * This library can be used to construct a visibility polygon for a set of line segments.
 * Time complexity: O(N log N) - optimal for this problem.
 */

/** 2D point represented as [x, y] */
export type Point = [number, number];

/** Line segment represented as two points [start, end] */
export type Segment = [Point, Point];

/** Polygon represented as an array of points */
export type Polygon = Point[];

/**
 * Visibility Polygon computation utilities
 */
export declare class VisibilityPolygon {
  /**
   * Computes a visibility polygon from an observer position.
   * O(N log N) time complexity.
   * 
   * @param position - The location of the observer [x, y]
   * @param segments - A list of line segments. Segments cannot intersect each other.
   *                   Use breakIntersections() to fix intersecting segments.
   * @returns The visibility polygon in clockwise vertex order
   * 
   * @example
   * const position: Point = [60, 60];
   * const segments: Segment[] = [
   *   [[0, 0], [100, 0]],
   *   [[100, 0], [100, 100]],
   *   [[100, 100], [0, 100]],
   *   [[0, 100], [0, 0]]
   * ];
   * const visibility = VisibilityPolygon.compute(position, segments);
   */
  static compute(position: Point, segments: Segment[]): Polygon;

  /**
   * Computes a visibility polygon within a viewport.
   * Faster than compute() when many segments are outside viewport.
   * 
   * @param position - The location of the observer (must be within viewport)
   * @param segments - A list of line segments (can intersect viewport boundaries)
   * @param viewportMinCorner - The minimum X and Y coordinates [minX, minY]
   * @param viewportMaxCorner - The maximum X and Y coordinates [maxX, maxY]
   * @returns The visibility polygon within the viewport in clockwise order
   * 
   * @example
   * const position: Point = [60, 60];
   * const segments: Segment[] = [...];
   * const visibility = VisibilityPolygon.computeViewport(
   *   position,
   *   segments,
   *   [50, 50],
   *   [450, 450]
   * );
   */
  static computeViewport(
    position: Point,
    segments: Segment[],
    viewportMinCorner: Point,
    viewportMaxCorner: Point
  ): Polygon;

  /**
   * Checks if a point is inside a polygon.
   * O(N) time complexity.
   * 
   * @param position - The point to check [x, y]
   * @param polygon - The polygon (clockwise or counterclockwise order)
   * @returns true if position is within the polygon
   * 
   * @example
   * const point: Point = [50, 50];
   * const polygon: Polygon = [[0,0], [100,0], [100,100], [0,100]];
   * const isInside = VisibilityPolygon.inPolygon(point, polygon);
   */
  static inPolygon(position: Point, polygon: Polygon): boolean;

  /**
   * Converts polygons to a list of line segments.
   * O(N) time complexity.
   * 
   * @param polygons - Array of polygons (each polygon is an array of points)
   * @returns Array of line segments
   * 
   * @example
   * const polygons: Polygon[] = [
   *   [[-1,-1], [501,-1], [501,501], [-1,501]],
   *   [[250,100], [260,140], [240,140]]
   * ];
   * const segments = VisibilityPolygon.convertToSegments(polygons);
   */
  static convertToSegments(polygons: Polygon[]): Segment[];

  /**
   * Breaks apart line segments so that none of them intersect.
   * O(N²) time complexity.
   * 
   * @param segments - Array of line segments (may intersect)
   * @returns Array of non-intersecting line segments
   * 
   * @example
   * const segments: Segment[] = [
   *   [[0, 0], [100, 100]],
   *   [[0, 100], [100, 0]]
   * ];
   * const broken = VisibilityPolygon.breakIntersections(segments);
   */
  static breakIntersections(segments: Segment[]): Segment[];

  /**
   * Returns the epsilon value used for floating-point comparisons.
   * @returns 0.0000001 (1e-7)
   */
  static epsilon(): number;

  /**
   * Checks if two points are equal (within epsilon tolerance).
   * @param a - First point
   * @param b - Second point
   * @returns true if points are equal within epsilon
   */
  static equal(a: Point, b: Point): boolean;

  /**
   * Calculates the angle from point a to point b.
   * @param a - First point
   * @param b - Second point
   * @returns Angle in degrees (-180 to 180)
   */
  static angle(a: Point, b: Point): number;

  /**
   * Calculates the intersection point of two lines.
   * @param a1 - First point of first line
   * @param a2 - Second point of first line
   * @param b1 - First point of second line
   * @param b2 - Second point of second line
   * @returns Intersection point, or empty array if lines are parallel
   */
  static intersectLines(a1: Point, a2: Point, b1: Point, b2: Point): Point | [];

  /**
   * Calculates squared distance between two points.
   * @param a - First point
   * @param b - Second point
   * @returns Squared Euclidean distance
   */
  static distance(a: Point, b: Point): number;

  /**
   * Checks if two line segments intersect.
   * @param x1, y1 - First point of first segment
   * @param x2, y2 - Second point of first segment
   * @param x3, y3 - First point of second segment
   * @param x4, y4 - Second point of second segment
   * @returns true if segments intersect
   */
  static doLineSegmentsIntersect(
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    x4: number, y4: number
  ): boolean;
}

export default VisibilityPolygon;
