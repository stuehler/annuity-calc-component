export function createSplinePathFromPoints (points, closed: boolean = false) {

	// points is an array of "points", where each point is a two-dimensional array: [x, y]

	let
		tgts,
		p,
		p0,
		pts,
		t,
		t0,
		i, l, n,
		point,
		command,
		commands,
		decimalPlaces;

	decimalPlaces = 2;		
	tgts = getTangents(points);

	p = points[1];
	p0 = points[0];
	pts = [];
	t = tgts[1];
	t0 = tgts[0];

	// Add starting 'M' and 'C' points
	pts.push(p0, [p0[0] + t0[0], p0[1] + t0[1], p[0] - t[0], p[1] - t[1], p[0], p[1]]);

	// Add 'S' points
	for (i = 2, l = tgts.length; i < l; i++) {
		p = points[i];
		t = tgts[i];
		pts.push([p[0] - t[0], p[1] - t[1], p[0], p[1]]);
	}

	commands = [];

	for (i = 0, l = pts.length; i < l; i++) {
		point = pts[i];
		n = point.length;

		if (!i) {
			command = "M" + (point[n - 2]).toFixed(decimalPlaces) + " " + (point[n - 1]).toFixed(decimalPlaces);
		} else if (n > 4) {
			command = "C" + (point[0]).toFixed(decimalPlaces) + ", " + (point[1]).toFixed(decimalPlaces);
			command += ", " + (point[2]).toFixed(decimalPlaces) + ", " + (point[3]).toFixed(decimalPlaces);
			command += ", " + (point[4]).toFixed(decimalPlaces) + ", " + (point[5]).toFixed(decimalPlaces);
		} else {
			command = "S" + (point[0]).toFixed(decimalPlaces) + ", " + (point[1]).toFixed(decimalPlaces);
			command += ", " + (point[2]).toFixed(decimalPlaces) + ", " + (point[3]).toFixed(decimalPlaces);
		}
		commands.push(command);
	}
	if (closed) {
		commands.push("Z");
	}

	return commands.join(" ");
};

function getTangents (points) {
	"use strict";

	let
		m,
		n,
		tangents,
		a,
		b,
		d,
		s,
		i,
		closeEnough;

	m = getFiniteDifferences(points);
	n = points.length - 1;
	closeEnough = 1e-6;

	tangents = [];

	for (i = 0; i < n; i++) {
		d = getSlope(points[i], points[i + 1]);

		if (Math.abs(d) < closeEnough) {
			m[i] = m[i + 1] = 0;
		} else {
			a = m[i] / d;
			b = m[i + 1] / d;
			s = (a * a) + (b * b);
			if (s > 9) {
				s = d * 3 / Math.sqrt(s);
				m[i] = s * a;
				m[i + 1] = s * b;
			}
		}
	}

	for (i = 0; i <= n; i++) {
		s = (points[Math.min(n, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
		tangents.push([s || 0, m[i] * s || 0]);
	}

	return tangents;
};
function getSlope (p0, p1) {
	return (p1[1] - p0[1]) / (p1[0] - p0[0]);
};
function getFiniteDifferences (points) {

	let
		m,
		p0,
		p1,
		d,
		i,
		n;

	m = [];
	p0 = points[0];
	p1 = points[1];
	d = m[0] = getSlope(p0, p1);
	i = 1;

	for (n = points.length - 1; i < n; i++) {
		p0 = p1;
		p1 = points[i + 1];
		m[i] = (d + (d = getSlope(p0, p1))) * 0.5;
	}
	m[i] = d;

	return m;
};