use getrandom::Error;

pub fn random_bool(limit: f32) -> bool {
    match random() {
        Ok(val) => val > limit,
        Err(_) => false,
    }
}

pub fn random() -> Result<f32, Error> {
    let mut buf = [0u8; 1];
    getrandom::getrandom(&mut buf)?;
    Ok(buf[0] as f32 / 255.0)
}

pub fn min_max<T: std::cmp::PartialOrd>(a: T, b: T) -> (T, T) {
    if a > b {
        (b, a)
    } else {
        (a, b)
    }
}

pub fn floor_to(val: usize, factor: usize) -> usize {
    val - val % factor
}

pub fn count<T: std::cmp::PartialOrd>(vec: &Vec<T>, pred: T) -> u32 {
    let mut counter = 0;

    for val in vec.iter() {
        if *val == pred {
            counter += 1;
        }
    }

    counter
}

/// Copies values from a source-vector into the target vector without
/// losing the aspect-ration defined by old_cols and new_cols.
/// factor is used in case the vector contains value-pairs and, in case of
/// resizing, only entire pairs should be copied.
pub fn copy_2d<T: Clone>(
    source: &Vec<T>,
    target: &mut Vec<T>,
    old_cols: usize,
    new_cols: usize,
    factor: usize,
    margin: usize,
) {
    let source_len = source.len();
    let target_len = target.len();

    // Calculate minimum / maximum amount of rows and cols
    let (min_cols, max_cols) = min_max(old_cols, new_cols);
    let (min_rows, max_rows) = min_max(source_len / old_cols, target_len / new_cols);

    // Calculate horizontal and vertical padding, used to center values
    let col_offset = floor_to((max_cols - min_cols) / 2, factor);
    let col_limit = floor_to(col_offset + min_cols, factor);
    let row_offset = (max_rows - min_rows) / 2;
    let row_limit = row_offset + min_rows;

    // Copy values, max is always the destination and min the source.
    // If the target is smaller both indices need to swapped.
    // It took me like 12h to code the following part, I'm super tired and I don't
    // even know how it works anymore - I beg your pardon.
    let swap = target_len > source_len;
    for row in (row_offset + margin)..(row_limit - margin) {
        let min_offset = (row - row_offset) * min_cols;
        let max_offset = row * max_cols;

        for col in (col_offset + margin)..(col_limit - margin) {
            let min_index = min_offset + (col - col_offset);
            let max_index = max_offset + col;

            if swap {
                target[max_index] = source[min_index].clone();
            } else {
                target[min_index] = source[max_index].clone();
            }
        }
    }
}
