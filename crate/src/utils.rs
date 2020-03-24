use getrandom::Error;
use wasm_bindgen::__rt::core::cmp::min;

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

pub fn copy_2d<T: Clone>(
    source: &mut Vec<T>,
    target: &mut Vec<T>,
    old_cols: usize,
    new_cols: usize,
) {
    let min_limit = min(target.len(), source.len());
    let min_cols = min(old_cols, new_cols);

    for i in 0.. {
        let src_offset = i * old_cols;
        let tar_offset = i * new_cols;

        for col in 0..min_cols {
            let src_index = src_offset + col;
            let tar_index = tar_offset + col;

            if tar_index < min_limit {
                target[tar_index] = source[src_index].clone();
            } else {
                return;
            }
        }
    }
}
